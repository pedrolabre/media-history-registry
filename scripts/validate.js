"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { SLUG_PATTERN } = require("./slugify");

const ROOT_DIR = path.resolve(__dirname, "..");
const SCHEMAS_DIR = path.join(ROOT_DIR, "schemas");
const EXAMPLES_DIR = path.join(ROOT_DIR, "examples");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_MEDIA_DIR = path.join(DATA_DIR, "media");
const DATA_HISTORY_DIR = path.join(DATA_DIR, "history");

const TAG_PATTERN = SLUG_PATTERN;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const WATCH_RECORD_ID_PATTERN = /^[0-9]{4}-[a-z0-9]+(?:-[a-z0-9]+)*(?:-rewatch)?$/;
const ISO_DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const IMDB_ID_PATTERN = /^tt[0-9]{7,10}$/;

const MEDIA_CATEGORIES = new Set([
  "movie",
  "series",
  "anime",
  "documentary",
  "docuseries",
  "special",
  "short",
  "other"
]);

const MEDIA_FORMATS = new Set(["series", "movie", "short", "special"]);
const MEDIA_STATUSES = new Set(["ongoing", "ended", "cancelled", "hiatus", "unknown"]);
const WATCH_STATUSES = new Set([
  "planned",
  "watching",
  "completed",
  "paused",
  "dropped",
  "rewatching",
  "abandoned"
]);

const MEDIA_KEYS = new Set([
  "id",
  "title",
  "original_title",
  "category",
  "subcategories",
  "format",
  "status",
  "genres",
  "countries",
  "studios",
  "directors",
  "first_release_year",
  "external_ids",
  "poster",
  "notes"
]);

const WATCH_RECORD_KEYS = new Set([
  "id",
  "media_id",
  "year",
  "unit",
  "watch_status",
  "started_at",
  "finished_at",
  "platform",
  "rewatch",
  "rating",
  "favorite",
  "notes"
]);

const EXTERNAL_ID_KEYS = new Set(["imdb", "tmdb", "anilist", "myanimelist"]);

const UNIT_RULES = {
  season: {
    allowedKeys: new Set(["type", "season_number"]),
    requiredKeys: ["type", "season_number"]
  },
  limited_season: {
    allowedKeys: new Set(["type"]),
    requiredKeys: ["type"]
  },
  episode: {
    allowedKeys: new Set(["type", "season_number", "episode_number"]),
    requiredKeys: ["type", "episode_number"]
  },
  arc: {
    allowedKeys: new Set(["type", "arc_name"]),
    requiredKeys: ["type", "arc_name"]
  },
  movie: {
    allowedKeys: new Set(["type"]),
    requiredKeys: ["type"]
  },
  special: {
    allowedKeys: new Set(["type"]),
    requiredKeys: ["type"]
  },
  full_work: {
    allowedKeys: new Set(["type"]),
    requiredKeys: ["type"]
  },
  unspecified: {
    allowedKeys: new Set(["type"]),
    requiredKeys: ["type"]
  }
};

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativePath(filePath) {
  return toPosixPath(path.relative(ROOT_DIR, filePath));
}

function sortByPath(values) {
  return [...values].sort((left, right) => relativePath(left).localeCompare(relativePath(right)));
}

function pushError(errors, filePath, location, message) {
  errors.push({
    filePath: relativePath(filePath),
    location,
    message
  });
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}

function isYear(value) {
  return Number.isInteger(value) && value >= 1878 && value <= 9999;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function collectJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return sortByPath(files);
}

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    pushError(errors, filePath, "$", `invalid JSON: ${error.message}`);
    return null;
  }
}

function requireDirectory(directory, errors) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    pushError(errors, directory, "$", "required directory is missing");
  }
}

function validateObject(value, filePath, location, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, filePath, location, "must be an object");
    return false;
  }

  return true;
}

function validateRequiredKeys(value, requiredKeys, filePath, location, errors) {
  for (const key of requiredKeys) {
    if (!hasOwn(value, key)) {
      pushError(errors, filePath, `${location}.${key}`, "is required");
    }
  }
}

function validateNoExtraKeys(value, allowedKeys, filePath, location, errors) {
  for (const key of Object.keys(value).sort()) {
    if (!allowedKeys.has(key)) {
      pushError(errors, filePath, `${location}.${key}`, "is not allowed");
    }
  }
}

function validateString(value, filePath, location, errors) {
  if (typeof value !== "string") {
    pushError(errors, filePath, location, "must be a string");
    return false;
  }

  return true;
}

function validateNonEmptyString(value, filePath, location, errors) {
  if (!validateString(value, filePath, location, errors)) {
    return false;
  }

  if (value.length === 0) {
    pushError(errors, filePath, location, "must not be empty");
    return false;
  }

  return true;
}

function validateNullableNonEmptyString(value, filePath, location, errors) {
  if (value === null || value === undefined) {
    return true;
  }

  return validateNonEmptyString(value, filePath, location, errors);
}

function validatePattern(value, pattern, filePath, location, description, errors) {
  if (!validateString(value, filePath, location, errors)) {
    return false;
  }

  if (!pattern.test(value)) {
    pushError(errors, filePath, location, `must match ${description}`);
    return false;
  }

  return true;
}

function validateEnum(value, allowedValues, filePath, location, errors) {
  if (!validateString(value, filePath, location, errors)) {
    return false;
  }

  if (!allowedValues.has(value)) {
    pushError(
      errors,
      filePath,
      location,
      `must be one of: ${[...allowedValues].sort().join(", ")}`
    );
    return false;
  }

  return true;
}

function validateUniqueStringArray(value, itemPattern, filePath, location, description, errors) {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    pushError(errors, filePath, location, "must be an array");
    return;
  }

  const seen = new Set();

  value.forEach((item, index) => {
    const itemLocation = `${location}[${index}]`;

    if (!validatePattern(item, itemPattern, filePath, itemLocation, description, errors)) {
      return;
    }

    if (seen.has(item)) {
      pushError(errors, filePath, itemLocation, `duplicates "${item}"`);
    } else {
      seen.add(item);
    }
  });
}

function validateUniqueNonEmptyStringArray(value, filePath, location, errors) {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    pushError(errors, filePath, location, "must be an array");
    return;
  }

  const seen = new Set();

  value.forEach((item, index) => {
    const itemLocation = `${location}[${index}]`;

    if (!validateNonEmptyString(item, filePath, itemLocation, errors)) {
      return;
    }

    if (seen.has(item)) {
      pushError(errors, filePath, itemLocation, `duplicates "${item}"`);
    } else {
      seen.add(item);
    }
  });
}

function validateNullableDate(value, filePath, location, errors) {
  if (value === undefined || value === null) {
    return true;
  }

  if (!validateString(value, filePath, location, errors)) {
    return false;
  }

  if (!isIsoDate(value)) {
    pushError(errors, filePath, location, "must be a valid date in YYYY-MM-DD format");
    return false;
  }

  return true;
}

function validateYearValue(value, filePath, location, errors) {
  if (!isYear(value)) {
    pushError(errors, filePath, location, "must be an integer year from 1878 to 9999");
    return false;
  }

  return true;
}

function validatePositiveIntegerValue(value, filePath, location, errors) {
  if (!isPositiveInteger(value)) {
    pushError(errors, filePath, location, "must be a positive integer");
    return false;
  }

  return true;
}

function validateSchemaDocument(value, expected, filePath, errors) {
  if (!validateObject(value, filePath, "$", errors)) {
    return;
  }

  if (value.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    pushError(errors, filePath, "$.$schema", "must be JSON Schema draft 2020-12");
  }

  if (value.$id !== expected.id) {
    pushError(errors, filePath, "$.$id", `must be "${expected.id}"`);
  }

  if (value.title !== expected.title) {
    pushError(errors, filePath, "$.title", `must be "${expected.title}"`);
  }

  if (value.type !== "object") {
    pushError(errors, filePath, "$.type", 'must be "object"');
  }

  if (!Array.isArray(value.required)) {
    pushError(errors, filePath, "$.required", "must be an array");
    return;
  }

  for (const requiredKey of expected.requiredKeys) {
    if (!value.required.includes(requiredKey)) {
      pushError(errors, filePath, "$.required", `must include "${requiredKey}"`);
    }
  }
}

function validateExternalIds(value, filePath, location, errors) {
  if (value === undefined) {
    return;
  }

  if (!validateObject(value, filePath, location, errors)) {
    return;
  }

  validateNoExtraKeys(value, EXTERNAL_ID_KEYS, filePath, location, errors);

  if (hasOwn(value, "imdb") && value.imdb !== null) {
    validatePattern(value.imdb, IMDB_ID_PATTERN, filePath, `${location}.imdb`, "an IMDB id", errors);
  }

  for (const key of ["tmdb", "anilist", "myanimelist"]) {
    if (!hasOwn(value, key) || value[key] === null) {
      continue;
    }

    validatePositiveIntegerValue(value[key], filePath, `${location}.${key}`, errors);
  }
}

function validateMediaItem(value, filePath, errors, options = {}) {
  if (!validateObject(value, filePath, "$", errors)) {
    return;
  }

  validateRequiredKeys(value, ["id", "title", "category", "format", "status"], filePath, "$", errors);
  validateNoExtraKeys(value, MEDIA_KEYS, filePath, "$", errors);

  if (hasOwn(value, "id")) {
    validatePattern(value.id, SLUG_PATTERN, filePath, "$.id", "a kebab-case slug", errors);
  }

  if (hasOwn(value, "title")) {
    validateNonEmptyString(value.title, filePath, "$.title", errors);
  }

  validateNullableNonEmptyString(value.original_title, filePath, "$.original_title", errors);

  if (hasOwn(value, "category")) {
    validateEnum(value.category, MEDIA_CATEGORIES, filePath, "$.category", errors);
  }

  validateUniqueStringArray(
    value.subcategories,
    TAG_PATTERN,
    filePath,
    "$.subcategories",
    "a kebab-case tag",
    errors
  );

  if (hasOwn(value, "format")) {
    validateEnum(value.format, MEDIA_FORMATS, filePath, "$.format", errors);
  }

  if (hasOwn(value, "status")) {
    validateEnum(value.status, MEDIA_STATUSES, filePath, "$.status", errors);
  }

  validateUniqueStringArray(value.genres, TAG_PATTERN, filePath, "$.genres", "a kebab-case tag", errors);
  validateUniqueStringArray(
    value.countries,
    COUNTRY_CODE_PATTERN,
    filePath,
    "$.countries",
    "an ISO 3166-1 alpha-2 country code",
    errors
  );
  validateUniqueNonEmptyStringArray(value.studios, filePath, "$.studios", errors);
  validateUniqueNonEmptyStringArray(value.directors, filePath, "$.directors", errors);

  if (hasOwn(value, "first_release_year") && value.first_release_year !== null) {
    validateYearValue(value.first_release_year, filePath, "$.first_release_year", errors);
  }

  validateExternalIds(value.external_ids, filePath, "$.external_ids", errors);

  if (hasOwn(value, "poster") && value.poster !== null) {
    validateNonEmptyString(value.poster, filePath, "$.poster", errors);
  }

  validateNullableNonEmptyString(value.notes, filePath, "$.notes", errors);

  if (options.requireDataPath) {
    validateMediaPath(value, filePath, errors);
  }
}

function validateUnit(value, filePath, location, errors) {
  if (!validateObject(value, filePath, location, errors)) {
    return;
  }

  if (!hasOwn(value, "type")) {
    pushError(errors, filePath, `${location}.type`, "is required");
    return;
  }

  if (typeof value.type !== "string" || !hasOwn(UNIT_RULES, value.type)) {
    pushError(
      errors,
      filePath,
      `${location}.type`,
      `must be one of: ${Object.keys(UNIT_RULES).sort().join(", ")}`
    );
    return;
  }

  const rule = UNIT_RULES[value.type];

  validateRequiredKeys(value, rule.requiredKeys, filePath, location, errors);
  validateNoExtraKeys(value, rule.allowedKeys, filePath, location, errors);

  if (hasOwn(value, "season_number")) {
    validatePositiveIntegerValue(value.season_number, filePath, `${location}.season_number`, errors);
  }

  if (hasOwn(value, "episode_number")) {
    validatePositiveIntegerValue(value.episode_number, filePath, `${location}.episode_number`, errors);
  }

  if (hasOwn(value, "arc_name")) {
    validateNonEmptyString(value.arc_name, filePath, `${location}.arc_name`, errors);
  }
}

function validateWatchRecord(value, filePath, errors, options = {}) {
  if (!validateObject(value, filePath, "$", errors)) {
    return;
  }

  validateRequiredKeys(value, ["id", "media_id", "year", "unit", "watch_status"], filePath, "$", errors);
  validateNoExtraKeys(value, WATCH_RECORD_KEYS, filePath, "$", errors);

  if (hasOwn(value, "id")) {
    validatePattern(value.id, WATCH_RECORD_ID_PATTERN, filePath, "$.id", "a watch record id", errors);
  }

  if (hasOwn(value, "media_id")) {
    validatePattern(value.media_id, SLUG_PATTERN, filePath, "$.media_id", "a kebab-case slug", errors);
  }

  if (hasOwn(value, "year")) {
    validateYearValue(value.year, filePath, "$.year", errors);
  }

  if (hasOwn(value, "unit")) {
    validateUnit(value.unit, filePath, "$.unit", errors);
  }

  if (hasOwn(value, "watch_status")) {
    validateEnum(value.watch_status, WATCH_STATUSES, filePath, "$.watch_status", errors);
  }

  const validStartedAt = validateNullableDate(value.started_at, filePath, "$.started_at", errors);
  const validFinishedAt = validateNullableDate(value.finished_at, filePath, "$.finished_at", errors);

  if (
    validStartedAt &&
    validFinishedAt &&
    typeof value.started_at === "string" &&
    typeof value.finished_at === "string" &&
    value.finished_at < value.started_at
  ) {
    pushError(errors, filePath, "$.finished_at", "must not be earlier than $.started_at");
  }

  validateNullableNonEmptyString(value.platform, filePath, "$.platform", errors);

  if (hasOwn(value, "rewatch") && typeof value.rewatch !== "boolean") {
    pushError(errors, filePath, "$.rewatch", "must be a boolean");
  }

  if (hasOwn(value, "rating") && value.rating !== null) {
    if (!isFiniteNumber(value.rating) || value.rating < 0) {
      pushError(errors, filePath, "$.rating", "must be a number greater than or equal to 0, or null");
    }
  }

  if (hasOwn(value, "favorite") && typeof value.favorite !== "boolean") {
    pushError(errors, filePath, "$.favorite", "must be a boolean");
  }

  validateNullableNonEmptyString(value.notes, filePath, "$.notes", errors);

  if (options.requireDataPath) {
    validateWatchRecordPath(value, filePath, errors);
  }
}

function mediaDataPathParts(filePath) {
  const relativeParts = toPosixPath(path.relative(ROOT_DIR, filePath)).split("/");

  if (
    relativeParts.length !== 4 ||
    relativeParts[0] !== "data" ||
    relativeParts[1] !== "media" ||
    !relativeParts[3].endsWith(".json")
  ) {
    return null;
  }

  return {
    category: relativeParts[2],
    fileId: path.basename(relativeParts[3], ".json")
  };
}

function historyDataPathParts(filePath) {
  const relativeParts = toPosixPath(path.relative(ROOT_DIR, filePath)).split("/");

  if (
    relativeParts.length !== 4 ||
    relativeParts[0] !== "data" ||
    relativeParts[1] !== "history" ||
    !relativeParts[3].endsWith(".json")
  ) {
    return null;
  }

  return {
    year: relativeParts[2],
    fileId: path.basename(relativeParts[3], ".json")
  };
}

function validateMediaPath(value, filePath, errors) {
  const parts = mediaDataPathParts(filePath);

  if (!parts) {
    pushError(errors, filePath, "$", "Media Item must be stored at data/media/{category}/{id}.json");
    return;
  }

  if (typeof value.id === "string" && value.id !== parts.fileId) {
    pushError(errors, filePath, "$.id", `must match filename "${parts.fileId}"`);
  }

  if (typeof value.category === "string" && value.category !== parts.category) {
    pushError(errors, filePath, "$.category", `must match directory "${parts.category}"`);
  }
}

function validateWatchRecordPath(value, filePath, errors) {
  const parts = historyDataPathParts(filePath);

  if (!parts) {
    pushError(errors, filePath, "$", "Watch Record must be stored at data/history/{year}/{id-without-year}.json");
    return;
  }

  if (Number.isInteger(value.year) && String(value.year) !== parts.year) {
    pushError(errors, filePath, "$.year", `must match directory "${parts.year}"`);
  }

  if (typeof value.id === "string" && Number.isInteger(value.year)) {
    const expectedId = `${value.year}-${parts.fileId}`;

    if (value.id !== expectedId) {
      pushError(errors, filePath, "$.id", `must match path-derived id "${expectedId}"`);
    }
  }
}

function classifyExample(value) {
  if (isPlainObject(value) && hasOwn(value, "media_id") && hasOwn(value, "unit")) {
    return "watch-record";
  }

  if (isPlainObject(value) && hasOwn(value, "category") && hasOwn(value, "format")) {
    return "media";
  }

  return "unknown";
}

function addUniqueId(index, value, filePath, label, errors) {
  if (typeof value !== "string") {
    return;
  }

  if (index.has(value)) {
    pushError(
      errors,
      filePath,
      "$.id",
      `${label} id "${value}" is duplicated; first seen in ${relativePath(index.get(value))}`
    );
    return;
  }

  index.set(value, filePath);
}

function validateAll() {
  const errors = [];

  requireDirectory(SCHEMAS_DIR, errors);
  requireDirectory(EXAMPLES_DIR, errors);
  requireDirectory(DATA_DIR, errors);
  requireDirectory(DATA_MEDIA_DIR, errors);
  requireDirectory(DATA_HISTORY_DIR, errors);

  const schemaFiles = collectJsonFiles(SCHEMAS_DIR);
  const exampleFiles = collectJsonFiles(EXAMPLES_DIR);
  const mediaFiles = collectJsonFiles(DATA_MEDIA_DIR);
  const watchRecordFiles = collectJsonFiles(DATA_HISTORY_DIR);
  const dataFiles = collectJsonFiles(DATA_DIR);
  const expectedDataFiles = new Set([...mediaFiles, ...watchRecordFiles]);

  for (const dataFile of dataFiles) {
    if (!expectedDataFiles.has(dataFile)) {
      pushError(errors, dataFile, "$", "data JSON files must be under data/media/ or data/history/");
    }
  }

  const schemaDocuments = new Map(schemaFiles.map((filePath) => [filePath, readJson(filePath, errors)]));
  const exampleDocuments = new Map(exampleFiles.map((filePath) => [filePath, readJson(filePath, errors)]));
  const mediaDocuments = new Map(mediaFiles.map((filePath) => [filePath, readJson(filePath, errors)]));
  const watchRecordDocuments = new Map(
    watchRecordFiles.map((filePath) => [filePath, readJson(filePath, errors)])
  );

  const expectedSchemas = [
    {
      filePath: path.join(SCHEMAS_DIR, "media.schema.json"),
      id: "media.schema.json",
      title: "Media Item",
      requiredKeys: ["id", "title", "category", "format", "status"]
    },
    {
      filePath: path.join(SCHEMAS_DIR, "watch-record.schema.json"),
      id: "watch-record.schema.json",
      title: "Watch Record",
      requiredKeys: ["id", "media_id", "year", "unit", "watch_status"]
    }
  ];

  for (const expectedSchema of expectedSchemas) {
    if (!schemaDocuments.has(expectedSchema.filePath)) {
      pushError(errors, expectedSchema.filePath, "$", "required schema file is missing");
      continue;
    }

    const schemaDocument = schemaDocuments.get(expectedSchema.filePath);

    if (schemaDocument !== null) {
      validateSchemaDocument(schemaDocument, expectedSchema, expectedSchema.filePath, errors);
    }
  }

  const exampleMediaIds = new Set();
  const exampleWatchRecords = [];

  for (const [filePath, value] of exampleDocuments) {
    if (value === null) {
      continue;
    }

    const type = classifyExample(value);

    if (type === "media") {
      validateMediaItem(value, filePath, errors);

      if (typeof value.id === "string") {
        exampleMediaIds.add(value.id);
      }
    } else if (type === "watch-record") {
      validateWatchRecord(value, filePath, errors);
      exampleWatchRecords.push({ filePath, value });
    } else {
      pushError(errors, filePath, "$", "example must look like a Media Item or Watch Record");
    }
  }

  for (const { filePath, value } of exampleWatchRecords) {
    if (
      typeof value.media_id === "string" &&
      exampleMediaIds.size > 0 &&
      !exampleMediaIds.has(value.media_id)
    ) {
      pushError(errors, filePath, "$.media_id", `example references missing example Media Item "${value.media_id}"`);
    }
  }

  const mediaById = new Map();
  const watchRecords = [];
  const watchRecordIds = new Map();

  for (const [filePath, value] of mediaDocuments) {
    if (value === null) {
      continue;
    }

    validateMediaItem(value, filePath, errors, { requireDataPath: true });
    addUniqueId(mediaById, value.id, filePath, "Media Item", errors);
  }

  for (const [filePath, value] of watchRecordDocuments) {
    if (value === null) {
      continue;
    }

    validateWatchRecord(value, filePath, errors, { requireDataPath: true });
    addUniqueId(watchRecordIds, value.id, filePath, "Watch Record", errors);
    watchRecords.push({ filePath, value });
  }

  for (const { filePath, value } of watchRecords) {
    if (typeof value.media_id === "string" && !mediaById.has(value.media_id)) {
      pushError(errors, filePath, "$.media_id", `Watch Record is orphaned; missing Media Item "${value.media_id}"`);
    }
  }

  const stats = {
    schemaCount: schemaFiles.length,
    exampleCount: exampleFiles.length,
    mediaCount: mediaFiles.length,
    watchRecordCount: watchRecordFiles.length,
    totalJsonCount: schemaFiles.length + exampleFiles.length + dataFiles.length
  };

  return { errors, stats };
}

function printSummary(stats) {
  console.log("Media History Registry validation");
  console.log("");
  console.log(`OK JSON parse: ${stats.totalJsonCount} file(s) in schemas/, examples/ and data/`);
  console.log(`OK schemas: ${stats.schemaCount} schema file(s) checked`);
  console.log(`OK examples: ${stats.exampleCount} example file(s) checked`);
  console.log(`OK data/media: ${stats.mediaCount} media item file(s) checked`);
  console.log(`OK data/history: ${stats.watchRecordCount} watch record file(s) checked`);
  console.log("OK cross-checks: paths, ids, years, media_id references and dates");
  console.log("");
  console.log("Validation passed.");
}

function printErrors(errors, stats) {
  console.error("Media History Registry validation");
  console.error("");
  console.error(`Validation failed with ${errors.length} error(s):`);

  for (const error of errors) {
    console.error(`- ${error.filePath} :: ${error.location} - ${error.message}`);
  }

  console.error("");
  console.error(`Checked JSON files: ${stats.totalJsonCount}`);
}

function main() {
  const { errors, stats } = validateAll();

  errors.sort((left, right) => {
    return (
      left.filePath.localeCompare(right.filePath) ||
      left.location.localeCompare(right.location) ||
      left.message.localeCompare(right.message)
    );
  });

  if (errors.length > 0) {
    printErrors(errors, stats);
    process.exitCode = 1;
    return;
  }

  printSummary(stats);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateAll
};
