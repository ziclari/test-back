// build-scenes.mjs
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";        // ← AGREGAR
import { expandFile } from "./include-resolver.mjs";

const SRC = "./src/scenes-src";
const OUT = "../";

async function build() {
  await fs.mkdir(OUT, { recursive: true });

  const files = await fs.readdir(SRC);
  for (const file of files) {
    if (!file.endsWith(".yaml")) continue;

    const fullIn = path.join(SRC, file);
    
    // 1. Expande includes
    const expandedText = await expandFile(fullIn);
    
    // 2. Parse YAML completo (transforma el texto en objeto JS)
    const parsed = yaml.load(expandedText);

    // 3. Vuelve a generar YAML bien formateado
    const finalYaml = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1,
      noArrayIndent: false,
      quotingType: '"'
    });

    const outFile = path.join(
      OUT,
      file//.replace(".yaml", ".compiled.yaml")
    );

    await fs.writeFile(outFile, finalYaml);
    console.log("Compiled:", file, "→", outFile);
  }
}

build();
