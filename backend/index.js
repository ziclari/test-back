import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";
import multer from "multer";
import helmet from "helmet";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from 'fs';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const MOODLE_BASE = process.env.MOODLE_BASE;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BASE_PATH = process.env.BASE_PATH || "/";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validación de secretos al inicio
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET y JWT_REFRESH_SECRET son requeridos en .env");
}

var router = express.Router();

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
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB ahora es seguro
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
    exposedHeaders: ["Authorization"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);
app.disable("x-powered-by");
app.use(BASE_PATH, router);

// ========================================
// UTILIDADES JWT
// ========================================

/**
 * Genera un access token (corta duración)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m", // 15 minutos
    issuer: "moodle-api",
    audience: "moodle-clients",
  });
}

/**
 * Genera un refresh token (larga duración)
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "1d",
    issuer: "moodle-api",
    audience: "moodle-clients",
  });
}

/**
 * Encripta el token de Moodle para almacenarlo en JWT
 */
function encryptMoodleToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(JWT_SECRET.padEnd(32, "0").slice(0, 32)),
    iv
  );

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Desencripta el token de Moodle desde JWT
 */
function decryptMoodleToken(encryptedToken) {
  if (!encryptedToken) return null;

  try {
    const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(JWT_SECRET.padEnd(32, "0").slice(0, 32)),
      iv
    );
    decipher.setAuthTag(authTag);

    const decrypted =
      decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return null;
  }
}

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================

/**
 * Middleware para verificar el JWT access token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Token no proporcionado",
      code: "NO_TOKEN",
    });
  }

  jwt.verify(
    token,
    JWT_SECRET,
    {
      issuer: "moodle-api",
      audience: "moodle-clients",
    },
    (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            error: "Token expirado",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(403).json({
          error: "Token inválido",
          code: "INVALID_TOKEN",
        });
      }

      req.user = payload;
      next();
    }
  );
}

// ========================================
// ENDPOINTS DE AUTENTICACIÓN
// ========================================

/**
 * Login con Moodle
 */
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const { data } = await axios.get(`${MOODLE_BASE}/login/token.php`, {
      params: { username, password, service: "moodle_mobile_app" },
    });

    if (data.error) {
      return res.status(401).json({ error: data.error });
    }

    if (!data.token) {
      return res.status(400).json({ error: "No se recibió token de Moodle" });
    }

    // Encriptar token de Moodle
    const encryptedMoodleToken = encryptMoodleToken(data.token);

    // Payload del JWT
    const payload = {
      username: username,
      moodleToken: encryptedMoodleToken,
      tokenType: "access",
    };

    // Generar tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({
      username: username,
      moodleToken: encryptedMoodleToken,
      tokenType: "refresh",
    });

    res.json({
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
      tokenType: "Bearer",
    });
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ error: "Error al autenticar con Moodle" });
  }
});

/**
 * Refresh token - obtiene un nuevo access token
 */
app.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token no proporcionado",
      code: "NO_REFRESH_TOKEN",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: "moodle-api",
      audience: "moodle-clients",
    });

    if (payload.tokenType !== "refresh") {
      return res.status(403).json({ error: "Token inválido" });
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken({
      username: payload.username,
      moodleToken: payload.moodleToken,
      tokenType: "access",
    });

    res.json({
      ok: true,
      accessToken: newAccessToken,
      expiresIn: 900,
      tokenType: "Bearer",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Refresh token expirado. Por favor, inicia sesión nuevamente",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }
    return res.status(403).json({ error: "Refresh token inválido" });
  }
});

/**
 * Verificar si el usuario está autenticado
 */
app.get("/auth/check", authenticateToken, (req, res) => {
  res.json({
    ok: true,
    username: req.user.username,
  });
});

/**
 * Logout (opcional - el cliente simplemente elimina los tokens)
 */
app.post("/auth/logout", authenticateToken, (req, res) => {
  // En una implementación completa, aquí podrías agregar el token a una blacklist
  res.json({ ok: true, message: "Sesión cerrada exitosamente" });
});

// ========================================
// ENDPOINTS DE MOODLE (protegidos)
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
app.post("/assignments", authenticateToken, async (req, res) => {
  const moodleToken = decryptMoodleToken(req.user.moodleToken);

  if (!moodleToken) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { courseId, prefix } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: "courseId es requerido" });
  }

  try {
    const { data } = await axios.get(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      {
        params: {
          wsfunction: "mod_assign_get_assignments",
          wstoken: moodleToken,
          moodlewsrestformat: "json",
        },
      }
    );

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
    }));

    res.json({ assignments: minimalAssignments });
  } catch (err) {
    //console.error("Error al obtener tareas:", err.message);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

/**
 * Obtener draft item ID
 */
app.get("/get-draft-itemid", authenticateToken, async (req, res) => {
  const moodleToken = decryptMoodleToken(req.user.moodleToken);

  if (!moodleToken) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const { data } = await axios.post(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      {},
      {
        params: {
          wstoken: moodleToken,
          wsfunction: "core_files_get_unused_draft_itemid",
          moodlewsrestformat: "json",
        },
      }
    );

    if (!data.itemid) {
      return res.status(500).json({ error: "No se pudo obtener itemid" });
    }

    res.json({ itemid: data.itemid });
  } catch (err) {
    //console.error("Error al obtener draft itemid:", err.message);
    res.status(500).json({ error: "Fallo al obtener draft itemid" });
  }
});

/**
 * Subir archivo draft
 */
app.post(
  "/upload-draft-file",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const moodleToken = decryptMoodleToken(req.user.moodleToken);

    if (!moodleToken) {
      return res.status(401).json({ error: "No autorizado" });
    }

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
          params: { token: moodleToken },
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (!Array.isArray(response.data) || response.data.length === 0) {
        return res.status(500).json({ error: "Respuesta inválida de Moodle" });
      }
      
      res.json(response.data[0]);
      fs.unlinkSync(req.file.path);
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error("Error al subir archivo:", err.message);
      res.status(500).json({
        error: "Error al subir archivo",
        details: err.message,
      });
    }
  }
);

/**
 * Enviar submission
 */
app.post("/submit", authenticateToken, async (req, res) => {
  const moodleToken = decryptMoodleToken(req.user.moodleToken);

  if (!moodleToken) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { assignmentId, itemId } = req.body;

  if (!assignmentId || !itemId) {
    return res
      .status(400)
      .json({ error: "assignmentId e itemId son requeridos" });
  }

  try {
    const params = new URLSearchParams();
    params.append("assignmentid", assignmentId);
    params.append(
      "plugindata[onlinetext_editor][text]",
      "Entrega desde simulador"
    );
    params.append("plugindata[onlinetext_editor][format]", "1");
    params.append("plugindata[onlinetext_editor][itemid]", itemId);
    params.append("plugindata[files_filemanager]", itemId);

    const { data } = await axios.post(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      params.toString(),
      {
        params: {
          wsfunction: "mod_assign_save_submission",
          wstoken: moodleToken,
          moodlewsrestformat: "json",
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    res.json(data);
  } catch (err) {
    //console.error("Error al guardar entrega:", err.message);
    res.status(500).json({ error: "Error al guardar entrega" });
  }
});

/**
 * Consultar estado de entrega
 */
app.post("/submission-status", authenticateToken, async (req, res) => {
  const moodleToken = decryptMoodleToken(req.user.moodleToken);

  if (!moodleToken) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { assignmentId, userId } = req.body;

  if (!assignmentId) {
    return res.status(400).json({ error: "assignmentId es requerido" });
  }

  try {
    const { data } = await axios.get(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      {
        params: {
          wsfunction: "mod_assign_get_submission_status",
          assignid: assignmentId,
          userid: userId,
          wstoken: moodleToken,
          moodlewsrestformat: "json",
        },
      }
    );

    res.json(data);
  } catch (err) {
    //console.error("Error al consultar entrega:", err.message);
    res.status(500).json({ error: "Error al consultar entrega" });
  }
});

/**
 * Obtener tareas enriquecidas con estado
 */
app.post("/assignments/enriched", authenticateToken, async (req, res) => {
  const moodleToken = decryptMoodleToken(req.user.moodleToken);

  if (!moodleToken) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { courseId, prefix } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: "courseId es requerido" });
  }

  try {
    const { data } = await axios.get(
      `${MOODLE_BASE}/webservice/rest/server.php`,
      {
        params: {
          wsfunction: "mod_assign_get_assignments",
          wstoken: moodleToken,
          moodlewsrestformat: "json",
        },
      }
    );

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
    }));

    const enriched = await Promise.all(
      minimalAssignments.map(async (a) => {
        try {
          const { data: status } = await axios.get(
            `${MOODLE_BASE}/webservice/rest/server.php`,
            {
              params: {
                wsfunction: "mod_assign_get_submission_status",
                wstoken: moodleToken,
                moodlewsrestformat: "json",
                assignid: a.id,
              },
            }
          );
          return {
            ...a,
            submissionstatus:
              status?.lastattempt?.submission?.status || "unknown",
          };
        } catch {
          return a;
        }
      })
    );

    res.json({ assignments: enriched });
  } catch (err) {
    //console.error("Error al obtener tareas enriquecidas:", err.message);
    res.status(500).json({
      error: "Error al obtener y enriquecer tareas",
      details: err.message,
    });
  }
});

// MANEJO DE ERRORES
app.use((err, req, res, next) => {
  //console.error("Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(isProduction ? {} : { details: err.message }),
  });
});

// INICIO DEL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(
    `Servidor activo en puerto ${PORT} (${
      isProduction ? "producción" : "local"
    })`
  )
);
