//include-resolver.mjs
import fs from "fs/promises";
import { resolveIncludesInText } from "./yaml-utils.mjs";

export async function expandFile(filePath, visited = new Set()) {
  if (visited.has(filePath)) throw new Error("Loop: " + filePath);
  visited.add(filePath);

  const raw = await fs.readFile(filePath, "utf8");

  return resolveIncludesInText(raw, filePath, visited);
}
