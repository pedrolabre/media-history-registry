export function deriveUnitLabel(unit) {
    if (!unit || typeof unit.type !== "string") {
        return "UN";
    }

    switch (unit.type) {
        case "season":
            return `S${padUnitNumber(unit.season_number)}`;
        case "limited_season":
            return "LS";
        case "episode":
            return unit.season_number
                ? `S${padUnitNumber(unit.season_number)}E${padUnitNumber(unit.episode_number)}`
                : `E${padUnitNumber(unit.episode_number)}`;
        case "arc":
            return "ARC";
        case "movie":
            return "MOV";
        case "special":
            return "SP";
        case "full_work":
            return "FW";
        case "unspecified":
            return "UN";
        default:
            return "UN";
    }
}

function padUnitNumber(value) {
    return String(Number.isInteger(value) ? value : 0).padStart(2, "0");
}
