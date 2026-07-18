export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function slugify(input) {
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
export function isSlug(value) {
    return SLUG_PATTERN.test(value);
}
