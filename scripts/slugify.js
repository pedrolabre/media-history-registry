"use strict";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(input) {
  if (typeof input !== "string") {
    throw new TypeError("slugify expects a string input.");
  }

  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

if (require.main === module) {
  const input = process.argv.slice(2).join(" ");

  if (!input) {
    console.error("Usage: node scripts/slugify.js <text>");
    process.exitCode = 1;
  } else {
    console.log(slugify(input));
  }
}

module.exports = {
  SLUG_PATTERN,
  slugify
};
