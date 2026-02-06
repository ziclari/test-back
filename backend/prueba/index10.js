import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";
import multer from "multer";
import helmet from "helmet";
import fs from 'fs';
import compression from "compression";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const MOODLE_BASE = process.env.MOODLE_BASE;
const MOODLE_ADMIN_TOKEN = process.env.MOODLE_ADMIN_TOKEN; // Token de admin
const FRONTEND_URL = process.env.FRONTEND_URL;
const BASE_PATH = process.env.BASE_PATH || "/";

// Validación de token al inicio
if (!MOODLE_ADMIN_TOKEN) {
  throw new Error("MOODLE_ADMIN_TOKEN es requerido en .env");
}

var router = express.Router();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/tmp');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Configuración de CORS para múltiples dominios
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [FRONTEND_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === "null" || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
  })
);
app.use(compression());
app.use(generalLimiter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    frameguard: { action: "deny" },
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);
app.disable("x-powered-by");
app.use(BASE_PATH, router);
app.set("trust proxy", 1);

// ========================================
// UTILIDADES MOODLE API
// ========================================

/**
 * Llama a la API de Moodle con el token de admin
 */
async function callMoodleAPI(wsfunction, params = {}) {
  try {
    const response = await axios.get(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      {
        params: {
          wsfunction,
          wstoken: MOODLE_ADMIN_TOKEN,
          moodlewsrestformat: "json",
          ...params,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error(`Error en ${wsfunction}:`, err.message);
    throw err;
  }
}

/**
 * Llama a la API de Moodle con POST
 */
async function callMoodleAPIPOST(wsfunction, body = {}, params = {}) {
  try {
    const response = await axios.post(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      body,
      {
        params: {
          wsfunction,
          wstoken: MOODLE_ADMIN_TOKEN,
          moodlewsrestformat: "json",
          ...params,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return response.data;
  } catch (err) {
    console.error(`Error en ${wsfunction}:`, err.message);
    throw err;
  }
}

// ========================================
// FUNCIONES DE GRUPOS
// ========================================

/**
 * Crea un grupo temporal para el usuario
 */
async function createTemporaryGroup(courseId, userId, userName) {
  const groupName = `TempGroup_User${userId}_${Date.now()}`;
  const groupDescription = `Grupo temporal para entrega de ${userName}`;

  const data = await callMoodleAPI("core_group_create_groups", {
    "groups[0][courseid]": courseId,
    "groups[0][name]": groupName,
    "groups[0][description]": groupDescription,
  });

  if (data && data[0] && data[0].id) {
    return {
      groupId: data[0].id,
      groupName: groupName,
    };
  }

  throw new Error("No se pudo crear el grupo");
}

/**
 * Añade miembros a un grupo
 */
async function addMembersToGroup(groupId, userIds) {
  const params = {};
  userIds.forEach((userId, index) => {
    params[`members[${index}][groupid]`] = groupId;
    params[`members[${index}][userid]`] = userId;
  });

  return await callMoodleAPI("core_group_add_group_members", params);
}

/**
 * Elimina miembros de un grupo
 */
async function removeMembersFromGroup(groupId, userIds) {
  const params = {};
  userIds.forEach((userId, index) => {
    params[`members[${index}][groupid]`] = groupId;
    params[`members[${index}][userid]`] = userId;
  });

  return await callMoodleAPI("core_group_delete_group_members", params);
}

/**
 * Elimina un grupo
 */
async function deleteGroup(groupId) {
  return await callMoodleAPI("core_group_delete_groups", {
    "groupids[0]": groupId,
  });
}

/**
 * Obtiene el ID del usuario admin (quien tiene el token)
 */
async function getAdminUserId() {
  // Obtener info del usuario actual (admin)
  const data = await callMoodleAPI("core_webservice_get_site_info");
  return data.userid;
}

// ========================================
// ENDPOINTS
// ========================================

/**
 * Endpoint para recibir los datos de LTI moodle
 */
app.post(
  "/lti/launch/:simulador",
  cors({ origin: true, credentials: true }),
  (req, res) => {
    const { user_id, context_id, prefix = "TAREA_APP" } = req.body;
    const { simulador } = req.params;
    const redirectUrl = `${FRONTEND_URL}/${simulador}?user=${encodeURIComponent(
      user_id
    )}&course_id=${encodeURIComponent(context_id)}&prefix=${encodeURIComponent(
      prefix
    )}`;
    res.redirect(302, redirectUrl);
  }
);

/**
 * Obtener tareas del curso
 */
app.post("/assignments", async (req, res) => {
  const { courseId, prefix } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: "courseId es requerido" });
  }

  try {
    const data = await callMoodleAPI("mod_assign_get_assignments");

    const course = data.courses?.find((c) => c.id === Number(courseId));
    if (!course) return res.json({ assignments: [] });

    const filtered = prefix
      ? course.assignments.filter((a) => a.name.startsWith(prefix))
      : course.assignments;

    const minimalAssignments = filtered.map((a) => ({
      id: a.id,
      cmid: a.cmid,
      course: a.course,
      name: a.name,
      duedate: a.duedate,
      allowsubmissionsfromdate: a.allowsubmissionsfromdate,
      completionsubmit: a.completionsubmit,
      teamsubmission: a.teamsubmission, // Importante para saber si acepta grupos
    }));

    res.json({ assignments: minimalAssignments });
  } catch (err) {
    console.error("Error al obtener tareas:", err.message);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

/**
 * Obtener draft item ID
 */
app.get("/get-draft-itemid", async (req, res) => {
  try {
    const data = await callMoodleAPIPOST("core_files_get_unused_draft_itemid");

    if (!data.itemid) {
      return res.status(500).json({ error: "No se pudo obtener itemid" });
    }

    res.json({ itemid: data.itemid });
  } catch (err) {
    console.error("Error al obtener draft itemid:", err.message);
    res.status(500).json({ error: "Fallo al obtener draft itemid" });
  }
});

/**
 * Subir archivo draft
 */
app.post("/upload-draft-file", upload.single("file"), async (req, res) => {
  const { itemid, filepath = "/" } = req.body;

  if (!itemid) {
    return res.status(400).json({ error: "itemid es requerido" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No se recibió archivo" });
  }

  try {
    const form = new FormData();
    const stream = fs.createReadStream(req.file.path);

    form.append("file_1", stream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append("itemid", itemid);
    form.append("filepath", filepath);

    const response = await axios.post(
      `${MOODLE_BASE}/webservice/upload.php`,
      form,
      {
        params: { token: MOODLE_ADMIN_TOKEN },
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    if (!Array.isArray(response.data) || response.data.length === 0) {
      return res.status(500).json({ error: "Respuesta inválida de Moodle" });
    }

    res.json(response.data[0]);
    await fs.promises.unlink(req.file.path);
  } catch (err) {
    if (req.file) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
    console.error("Error al subir archivo:", err.message);
    res.status(500).json({
      error: "Error al subir archivo",
      details: err.message,
    });
  }
});

/**
 * Enviar submission usando grupos temporales
 * Este es el endpoint PRINCIPAL que implementa el truco de grupos
 */
app.post("/submit", async (req, res) => {
  const { assignmentId, itemId, userId, userName, courseId } = req.body;

  if (!assignmentId || !itemId || !userId || !courseId) {
    return res.status(400).json({
      error: "assignmentId, itemId, userId y courseId son requeridos",
    });
  }

  let groupId = null;
  let adminUserId = null;

  try {
    // 1. Obtener el ID del usuario admin
    adminUserId = await getAdminUserId();
    console.log(`Admin User ID: ${adminUserId}`);

    // 2. Crear grupo temporal
    const group = await createTemporaryGroup(
      courseId,
      userId,
      userName || `User${userId}`
    );
    groupId = group.groupId;
    console.log(`Grupo creado: ${group.groupName} (ID: ${groupId})`);

    // 3. Añadir al estudiante y al admin al grupo
    await addMembersToGroup(groupId, [userId, adminUserId]);
    console.log(`Miembros añadidos: User ${userId} y Admin ${adminUserId}`);

    // 4. El admin hace la entrega (esto la asignará al grupo y por ende al estudiante)
    const params = new URLSearchParams();
    params.append("assignmentid", assignmentId);
    params.append(
      "plugindata[onlinetext_editor][text]",
      "Entrega desde simulador"
    );
    params.append("plugindata[onlinetext_editor][format]", "1");
    params.append("plugindata[onlinetext_editor][itemid]", itemId);
    params.append("plugindata[files_filemanager]", itemId);

    const submissionData = await callMoodleAPIPOST(
      "mod_assign_save_submission",
      params.toString()
    );

    console.log(`Entrega realizada para assignment ${assignmentId}`);

    // 5. Limpieza: Remover al admin del grupo
    await removeMembersFromGroup(groupId, [adminUserId]);
    console.log(`Admin removido del grupo ${groupId}`);

    // 6. (Opcional) Eliminar el grupo si ya no se necesita
    // Comentado por si quieres mantener el grupo para auditoría
    // await deleteGroup(groupId);
    // console.log(`Grupo ${groupId} eliminado`);

    res.json({
      success: true,
      message: "Entrega realizada exitosamente",
      groupId: groupId,
      groupName: group.groupName,
      submission: submissionData,
    });
  } catch (err) {
    console.error("Error al guardar entrega:", err.message);

    // Limpieza en caso de error
    if (groupId && adminUserId) {
      try {
        await removeMembersFromGroup(groupId, [adminUserId]);
        // await deleteGroup(groupId);
      } catch (cleanupErr) {
        console.error("Error en limpieza:", cleanupErr.message);
      }
    }

    res.status(500).json({
      error: "Error al guardar entrega",
      details: err.message,
    });
  }
});

/**
 * Consultar estado de entrega
 */
app.post("/submission-status", async (req, res) => {
  const { assignmentId, userId } = req.body;

  if (!assignmentId) {
    return res.status(400).json({ error: "assignmentId es requerido" });
  }

  try {
    const data = await callMoodleAPI("mod_assign_get_submission_status", {
      assignid: assignmentId,
      userid: userId,
    });

    res.json(data);
  } catch (err) {
    console.error("Error al consultar entrega:", err.message);
    res.status(500).json({ error: "Error al consultar entrega" });
  }
});

async function pLimit(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Obtener tareas enriquecidas con estado
 */
app.post("/assignments/enriched", async (req, res) => {
  const { courseId, prefix, userId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: "courseId es requerido" });
  }

  try {
    const data = await callMoodleAPI("mod_assign_get_assignments");

    const course = data.courses?.find((c) => c.id === Number(courseId));
    if (!course) return res.json({ assignments: [] });

    const filtered = prefix
      ? course.assignments.filter((a) => a.name.startsWith(prefix))
      : course.assignments;

    const minimalAssignments = filtered.map((a) => ({
      id: a.id,
      cmid: a.cmid,
      course: a.course,
      name: a.name,
      duedate: a.duedate,
      allowsubmissionsfromdate: a.allowsubmissionsfromdate,
      completionsubmit: a.completionsubmit,
      teamsubmission: a.teamsubmission,
    }));

    const enriched = await pLimit(minimalAssignments, 5, async (a) => {
      try {
        const status = await callMoodleAPI("mod_assign_get_submission_status", {
          assignid: a.id,
          ...(userId && { userid: userId }),
        });

        return {
          ...a,
          submissionstatus:
            status?.lastattempt?.submission?.status || "unknown",
        };
      } catch {
        return a;
      }
    });

    res.json({ assignments: enriched });
  } catch (err) {
    console.error("Error al obtener tareas enriquecidas:", err.message);
    res.status(500).json({
      error: "Error al obtener y enriquecer tareas",
      details: err.message,
    });
  }
});

// ========================================
// ENDPOINTS DE GESTIÓN DE GRUPOS (para debugging)
// ========================================

/**
 * Listar grupos de un curso
 */
app.get("/groups/:courseId", async (req, res) => {
  const { courseId } = req.params;

  try {
    const data = await callMoodleAPI("core_group_get_course_groups", {
      courseid: courseId,
    });

    res.json({ groups: data });
  } catch (err) {
    console.error("Error al obtener grupos:", err.message);
    res.status(500).json({ error: "Error al obtener grupos" });
  }
});

/**
 * Obtener miembros de un grupo
 */
app.get("/group-members/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    const data = await callMoodleAPI("core_group_get_group_members", {
      "groupids[0]": groupId,
    });

    res.json({ members: data });
  } catch (err) {
    console.error("Error al obtener miembros:", err.message);
    res.status(500).json({ error: "Error al obtener miembros" });
  }
});

/**
 * Limpiar grupos temporales (útil para mantenimiento)
 */
app.post("/cleanup-temp-groups/:courseId", async (req, res) => {
  const { courseId } = req.params;

  try {
    const groups = await callMoodleAPI("core_group_get_course_groups", {
      courseid: courseId,
    });

    const tempGroups = groups.filter((g) => g.name.startsWith("TempGroup_"));
    const deleted = [];

    for (const group of tempGroups) {
      try {
        await deleteGroup(group.id);
        deleted.push(group.name);
      } catch (err) {
        console.error(`Error al eliminar grupo ${group.id}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `${deleted.length} grupos temporales eliminados`,
      deleted,
    });
  } catch (err) {
    console.error("Error en limpieza:", err.message);
    res.status(500).json({ error: "Error en limpieza de grupos" });
  }
});

// MANEJO DE ERRORES
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(isProduction ? {} : { details: err.message }),
  });
});

// INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (!isProduction) {
    console.log(`Servidor activo en puerto ${PORT}`);
    console.log(`Usando Moodle en: ${MOODLE_BASE}`);
  }
});