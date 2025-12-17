import path from "path";
import fs from "fs/promises";

export async function resolveIncludesInText(text, basePath, visited) {
  const regex = /^(\s*)-?\s*!include\s+(.+?)\s*$/gm;

  let result = text;

  const matches = [...text.matchAll(regex)];

  for (const match of matches) {
    const indent = match[1] || "";
    const includePath = match[2].trim();

    const abs = path.resolve(path.dirname(basePath), includePath);

    const includedText = await fs.readFile(abs, "utf8");

    // ajustar indentación del bloque insertado
    const indented = includedText
      .split("\n")
      .map(line => (line.trim() === "" ? "" : indent + line))
      .join("\n");

    result = result.replace(match[0], indented);
  }

  return result;
}
