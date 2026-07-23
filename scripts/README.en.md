<div align="right">
  <a href="./README.md">🇧🇷 Português</a> &nbsp;•&nbsp; 🇺🇸 <b>English</b>
</div>

<div align="center">

![Scripts Banner](../assets/banner-scripts-en.svg)

</div>

This folder contains auxiliary scripts for the **Media History Registry**.

All commands must be executed from the repository root:

```powershell
node scripts\script-name.js
```

---

<details>
<summary><span style="font-size: 1.5em; font-weight: 600;">🧹 <code>clear-data.js</code></span></summary>

Recursively removes all `.json` files found inside the `data/` folder.

This script was primarily created to remove dummy data before you start registering your actual audiovisual history.

It can delete files in paths like:

```text
data/media/
data/history/
```

The script does not modify JSON files located in other folders, such as:

```text
examples/
schemas/
```

After cleaning, it preserves the mandatory folders via the files:

```text
data/media/.gitkeep
data/history/.gitkeep
```

This is required because Git does not version completely empty folders, while `validate.js` requires that `data/media/` and `data/history/` exist.

### Dry run (Simulation)

Before actually removing files, run the simulation mode:

```powershell
node scripts\clear-data.js --dry-run
```

This command shows which files would be removed, but does not modify the project.

Example:

```text
Arquivos que seriam removidos:
- data/history/2024/your-name.json
- data/history/2026/spy-family-s02.json
- data/media/anime/spy-family.json

Simulação concluída: 3 arquivo(s) JSON seriam removidos.
Nenhum arquivo foi alterado.
```

### Execute cleanup

After checking the simulation:

```powershell
node scripts\clear-data.js
```

After cleaning, run validation:

```powershell
node scripts\validate.js
```

A `data/` folder without JSON records is valid. The result should indicate:

```text
OK data/media: 0 media item file(s) checked
OK data/history: 0 watch record file(s) checked

Validation passed.
```

</details>
---

<details>
<summary><span style="font-size: 1.5em; font-weight: 600;">🔤 <code>slugify.js</code></span></summary>

Converts a string into a kebab-case slug.

This format is used for IDs, filenames, and paths of Media Items and Watch Records.

### Usage

```powershell
node scripts\slugify.js "Text to be converted"
```

Example:

```powershell
node scripts\slugify.js "Spy x Family"
```

Result:

```text
spy-x-family
```

The script:

- converts the text to lowercase;
- removes accents;
- removes apostrophes;
- replaces spaces and special characters with hyphens;
- removes duplicate hyphens;
- removes hyphens from the start and end.

Another example:

```powershell
node scripts\slugify.js "Mistborn: O Império Final"
```

Result:

```text
mistborn-o-imperio-final
```

It can also be imported by other CommonJS scripts:

```js
const { SLUG_PATTERN, slugify } = require("./slugify");

const id = slugify("Your Name");

console.log(id);
```

</details>
---

<details>
<summary><span style="font-size: 1.5em; font-weight: 600;">🛠️ <code>validate.js</code></span></summary>

Validates JSON files, paths, and relationships in the Media History Registry.

### Usage

```powershell
node scripts\validate.js
```

The script checks the files present in:

```text
schemas/
examples/
data/media/
data/history/
```

### Schemas

Checks if the mandatory schemas exist and contain the expected basic information:

```text
schemas/media.schema.json
schemas/watch-record.schema.json
```

### Examples

Validates the documentary files present in:

```text
examples/
```

Examples must represent a valid Media Item or Watch Record.

When an example Watch Record references a `media_id`, a corresponding Media Item must exist among the examples.

### Media Items

Media Items must be in the format:

```text
data/media/{category}/{id}.json
```

Example:

```text
data/media/anime/spy-family.json
```

The script checks, among other rules:

- object structure;
- required properties;
- disallowed properties;
- `id` format;
- correspondence between `id` and filename;
- correspondence between `category` and folder;
- allowed categories;
- allowed formats;
- allowed production statuses;
- country codes;
- external IDs;
- years;
- duplicate values in lists;
- duplicate Media Item IDs.

### Watch Records

Watch Records must be in the format:

```text
data/history/{year}/{id-without-year}.json
```

Example:

```text
data/history/2026/spy-family-s02.json
```

With a corresponding ID:

```json
{
  "id": "2026-spy-family-s02"
}
```

The script checks, among other rules:

- object structure;
- required properties;
- disallowed properties;
- `id` format;
- correspondence between year and folder;
- correspondence between ID and filename;
- unit types;
- season and episode numbers;
- allowed personal statuses;
- date format and validity;
- end date earlier than start date;
- rating;
- boolean values;
- duplicate Watch Record IDs.

### Relationships

Each Watch Record must have a `media_id` corresponding to an existing Media Item in `data/media/`.

For example:

```json
{
  "media_id": "spy-family"
}
```

Requires the existence of a file like:

```text
data/media/anime/spy-family.json
```

Otherwise, the record is considered orphaned and validation will fail.

### Expected result

When there are no errors:

```text
Media History Registry validation

OK JSON parse: 4 file(s) in schemas/, examples/ and data/
OK schemas: 2 schema file(s) checked
OK examples: 2 example file(s) checked
OK data/media: 0 media item file(s) checked
OK data/history: 0 watch record file(s) checked
OK cross-checks: paths, ids, years, media_id references and dates

Validation passed.
```

When an issue is found, the script reports:

- file;
- field or location;
- error description.

Example:

```text
Validation failed with 1 error(s):

- data/history/2026/spy-family-s02.json :: $.media_id - Watch Record is orphaned; missing Media Item "spy-family"
```

The process exits with an error code, allowing the validation to also be used in GitHub Actions.

### Check script syntax

To only check the JavaScript syntax:

```powershell
node --check scripts\clear-data.js
node --check scripts\slugify.js
node --check scripts\validate.js
```


</details>
---

<div align="center">
Developed by <b>Pedro Labre</b>
</div>
