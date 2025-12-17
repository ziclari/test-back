import { moodleApi, setAccessToken } from "./moodleApi";
import { stateManager } from "../../managers/stateManager";
/**
 * Login de usuario (el backend se encarga de comunicarse con Moodle)
 */
export async function loginUser(username, password) {
  try {
    const { data } = await moodleApi.post("/auth/login", {
      username,
      password,
    });
    if (!data.ok) throw new Error(data.error || "Error en autenticación");
    setAccessToken(data.accessToken);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    return true;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw new Error(error?.response?.data?.error || "Fallo al iniciar sesión");
  }
}
export async function refreshSession() {
  try {
    const refreshToken = sessionStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No hay refresh token");

    console.log("Intentando refrescar sesión...");

    const { data: refreshData } = await moodleApi.post("/auth/refresh", {
      refreshToken,
    });
    setAccessToken(refreshData.accessToken);
    const { data: checkData } = await moodleApi.get("/auth/check");

    if (!checkData.ok) throw new Error("Refresh fallido");

    console.log("Sesión validada correctamente");
    return true;
  } catch (err) {
    console.error(
      "Error al refrescar sesión:",
      err.response?.data || err.message
    );
    setAccessToken(null);
    sessionStorage.removeItem("refreshToken");
    return false;
  }
}

/**
 * Obtener tareas del curso desde el backend
 */
export async function getAssignments() {
  const cached = stateManager.get("assignments");
  // Si hay algo en caché, intenta usarlo
  if (cached) {
    try {
      const parsed = cached;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed; // usa el caché válido
      }
    } catch {
      console.warn("Caché de assignments corrupto. Se recargará.");
    }
  }

  // Si no hay caché válido, consulta al backend
  const courseId = sessionStorage.getItem("courseId");
  const prefix = sessionStorage.getItem("prefix");

  if (!courseId || !prefix) {
    console.warn("Faltan datos de sesión. No se pueden recuperar tareas.");
    return [];
  }

  try {
    const { data } = await moodleApi.post(`/assignments/enriched`, {
      courseId,
      prefix,
    });

    const assignments = data.assignments || [];
    stateManager.set("assignments", assignments);
    return assignments;
  } catch (error) {
    console.error("Error al consultar tareas:", error);
    throw new Error("Error al consultar tareas");
  }
}

/**
 * Paso 1: Subir archivo al backend (el backend lo sube al borrador Moodle)
 */
export const uploadFileToDraft = async (file) => {
  try {
    // 1. Obtener draft itemid
    const { data: draftData } = await moodleApi.get("/get-draft-itemid");

    const itemid = Number(draftData.itemid);
    if (!itemid) throw new Error("No se pudo obtener itemid");

    // 2. Subir archivo
    const formData = new FormData();
    formData.append("file", file);
    formData.append("itemid", itemid);
    formData.append("filepath", "/");

    const { data: uploadResponse } = await moodleApi.post(
      "/upload-draft-file",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // El backend ahora devuelve directamente el objeto, no un array
    if (!uploadResponse?.itemid) {
      throw new Error("No se recibió itemid en la respuesta");
    }

    return Number(uploadResponse.itemid);
  } catch (error) {
    console.error("Error al subir archivo a borrador:", error);
    throw new Error("Fallo al subir archivo a Moodle");
  }
};
/**
 * Paso 2: Guardar entrega de tarea en Moodle a través del backend
 */
export async function saveSubmission(assignmentId, itemId) {
  try {
    const { data } = await moodleApi.post(`/submit`, {
      assignmentId,
      itemId,
      text: "Entrega desde simulador",
    });

    if (data?.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("Error al guardar entrega:", error);
    throw new Error("Fallo al guardar entrega");
  }
}

/**
 * Paso 3: Orquestar subida + entrega
 */
export async function submitAssignment(assignmentId, file) {
  const itemid = await uploadFileToDraft(file);
  const submission = await saveSubmission(assignmentId, itemid);
  return submission;
}

/**
 * Consultar estado de entrega
 */
export async function getSubmissionStatus(assignmentId) {
  try {
    const { data } = await moodleApi.get(`/submission-status/${assignmentId}`);
    return data;
  } catch (error) {
    console.error("Error al consultar estado de entrega:", error);
    throw new Error("Error al consultar estado de entrega");
  }
}
