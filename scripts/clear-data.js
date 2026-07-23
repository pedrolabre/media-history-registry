"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const MEDIA_DIR = path.join(DATA_DIR, "media");
const HISTORY_DIR = path.join(DATA_DIR, "history");

const isDryRun = process.argv.includes("--dry-run");

function toRelativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join("/");
}

function collectJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    // Não segue links simbólicos para fora de data/.
    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function removeEmptyDirectories(directory, protectedDirectories) {
  if (!fs.existsSync(directory)) {
    return;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      continue;
    }

    removeEmptyDirectories(
      path.join(directory, entry.name),
      protectedDirectories
    );
  }

  const normalizedDirectory = path.resolve(directory);

  if (protectedDirectories.has(normalizedDirectory)) {
    return;
  }

  if (fs.readdirSync(directory).length === 0) {
    fs.rmdirSync(directory);
    console.log(`Pasta vazia removida: ${toRelativePath(directory)}`);
  }
}

function createGitKeep(directory) {
  fs.mkdirSync(directory, { recursive: true });

  const gitKeepPath = path.join(directory, ".gitkeep");

  if (!fs.existsSync(gitKeepPath)) {
    fs.writeFileSync(gitKeepPath, "", "utf8");
    console.log(`Criado: ${toRelativePath(gitKeepPath)}`);
  }
}

function main() {
  if (!fs.existsSync(DATA_DIR) || !fs.statSync(DATA_DIR).isDirectory()) {
    console.error(`Pasta não encontrada: ${DATA_DIR}`);
    process.exitCode = 1;
    return;
  }

  const jsonFiles = collectJsonFiles(DATA_DIR);

  if (jsonFiles.length === 0) {
    console.log("Nenhum arquivo JSON foi encontrado dentro de data/.");
  } else {
    console.log(
      `${isDryRun ? "Arquivos que seriam removidos" : "Removendo arquivos"}:`
    );

    for (const filePath of jsonFiles) {
      console.log(`- ${toRelativePath(filePath)}`);

      if (!isDryRun) {
        fs.unlinkSync(filePath);
      }
    }
  }

  if (isDryRun) {
    console.log("");
    console.log(
      `Simulação concluída: ${jsonFiles.length} arquivo(s) JSON seriam removidos.`
    );
    console.log("Nenhum arquivo foi alterado.");
    return;
  }

  const protectedDirectories = new Set([
    path.resolve(DATA_DIR),
    path.resolve(MEDIA_DIR),
    path.resolve(HISTORY_DIR)
  ]);

  removeEmptyDirectories(DATA_DIR, protectedDirectories);

  // O Git não versiona pastas vazias. Estes arquivos preservam as pastas
  // obrigatórias para scripts/validate.js em clones e no GitHub Actions.
  createGitKeep(MEDIA_DIR);
  createGitKeep(HISTORY_DIR);

  console.log("");
  console.log(
    `Limpeza concluída: ${jsonFiles.length} arquivo(s) JSON removido(s) de data/.`
  );
  console.log("examples/ e schemas/ não foram modificados.");
}

main();