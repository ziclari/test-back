import yaml from "js-yaml";

/**
 * Carga un manifest.yaml desde una URL.
 * Detecta errores comunes como:
 * - Servidor devolviendo HTML (404, error handler, SPA).
 * - YAML inválido.
 */
export async function loadModuleManifest(url) {
  let res;

  try {
    res = await fetch(url, {
      headers: { Accept: "text/yaml, text/plain, */*" }
    });
  } catch (err) {
    throw new Error(`No se pudo conectar para obtener manifest: ${url}`);
  }

  if (!res.ok) {
    throw new Error(
      `Error HTTP ${res.status} al obtener manifest: ${url}`
    );
  }

  const text = await res.text();

  // --------------------------
  // 1. Detectar HTML inesperado
  // --------------------------
  if (typeof text === "string") {
    const trimmed = text.trim();

    // HTML típico
    if (
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<html") ||
      trimmed.startsWith("<HTML")
    ) {
      throw new Error(
        `El servidor devolvió HTML en lugar de YAML: ${url}`
      );
    }
  }

  // --------------------------
  // 2. Parseo YAML
  // --------------------------
  let data;

  try {
    data = yaml.load(text);
  } catch (err) {
    throw new Error(`YAML inválido en manifest: ${url}\n${err.message}`);
  }

  // --------------------------
  // 3. Validación mínima
  // --------------------------
  if (!data || typeof data !== "object") {
    throw new Error(`Manifest vacío o inválido en: ${url}`);
  }

  if (!data.meta) {
    throw new Error(`Manifest sin sección "meta": ${url}`);
  }

  if (!data.scenes || !Array.isArray(data.scenes)) {
    throw new Error(`Manifest sin lista "scenes": ${url}`);
  }

  return data;
}
