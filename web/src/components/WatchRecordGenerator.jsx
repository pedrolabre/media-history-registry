import { useMemo, useState } from "react";
import { JsonOutputBlock } from "./JsonOutputBlock";
import {
    WATCH_STATUS_OPTIONS,
    WATCH_UNIT_OPTIONS,
    buildWatchRecordGeneratorOutput,
    createInitialWatchRecordFormState
} from "../utils/watchRecordGenerator";

const REQUIRED_FIELDS = new Set([
    "selectedMediaId",
    "manualMediaId",
    "year",
    "unitType",
    "seasonNumber",
    "episodeNumber",
    "arcName",
    "watchStatus"
]);

const MEDIA_ID_MODE_OPTIONS = [
    {
        value: "existing",
        label: "Selecionar midia",
        description: "Usa o id de um Media Item ja carregado."
    },
    {
        value: "manual",
        label: "Informar manualmente",
        description: "Mantem o fallback para uma midia ainda nao commitada."
    }
];

export function WatchRecordGenerator({ mediaItems = [] }) {
    const startsWithExistingMedia = Array.isArray(mediaItems) && mediaItems.length > 0;
    const [form, setForm] = useState(() => ({
        ...createInitialWatchRecordFormState(),
        mediaIdMode: startsWithExistingMedia ? "existing" : "manual"
    }));
    const [touched, setTouched] = useState({});
    const [mediaSearch, setMediaSearch] = useState("");
    const selectorItems = useMemo(() => normalizeMediaSelectorItems(mediaItems), [mediaItems]);
    const selectedMedia = useMemo(
        () => selectorItems.find((mediaItem) => mediaItem.id === form.selectedMediaId) || null,
        [form.selectedMediaId, selectorItems]
    );
    const filteredMediaItems = useMemo(
        () => filterMediaSelectorItems(selectorItems, mediaSearch, selectedMedia),
        [mediaSearch, selectedMedia, selectorItems]
    );
    const unitSuggestion = getUnitSuggestion(selectedMedia);
    const result = useMemo(() => buildWatchRecordGeneratorOutput(form), [form]);

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value
        }));
    }

    function updateBooleanField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value
        }));
    }

    function updateUnitType(value) {
        setTouched((current) => ({
            ...current,
            unitType: true
        }));
        updateField("unitType", value);
    }

    function updateMediaIdMode(value) {
        setTouched((current) => ({
            ...current,
            selectedMediaId: false,
            manualMediaId: false
        }));
        setForm((current) => ({
            ...current,
            mediaIdMode: value,
            selectedMediaId: value === "manual" ? "" : current.selectedMediaId,
            manualMediaId: value === "existing" ? "" : current.manualMediaId
        }));

        if (value === "manual") {
            setMediaSearch("");
        }
    }

    function updateSelectedMediaId(value) {
        const nextMedia = selectorItems.find((mediaItem) => mediaItem.id === value) || null;
        const nextSuggestion = getUnitSuggestion(nextMedia);

        setForm((current) => ({
            ...current,
            selectedMediaId: value,
            manualMediaId: "",
            unitType: nextSuggestion && !touched.unitType ? nextSuggestion.value : current.unitType
        }));
    }

    function updateManualMediaId(value) {
        setForm((current) => ({
            ...current,
            selectedMediaId: "",
            manualMediaId: value
        }));
    }

    function markTouched(field) {
        setTouched((current) => ({
            ...current,
            [field]: true
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        setTouched({
            selectedMediaId: true,
            manualMediaId: true,
            year: true,
            unitType: true,
            seasonNumber: true,
            episodeSeasonNumber: true,
            episodeNumber: true,
            arcName: true,
            watchStatus: true,
            startedAt: true,
            finishedAt: true,
            rating: true
        });
    }

    const filePath = result.ok ? result.file.repositoryPath : "data/history/{year}/{slug}.json";
    const previewErrorCount = Object.keys(result.errors).length;
    const resolvedMediaId =
        form.mediaIdMode === "existing" ? form.selectedMediaId : form.manualMediaId;

    return (<div className="media-generator watch-record-generator">
      <div className="generated-summary" aria-label="Resumo do Watch Record" role="group">
        <div className="file-card">
          <span className="file-card-label">ID gerado</span>
          <strong>{result.id || "aguardando dados"}</strong>
        </div>
        <div className="file-card file-card-wide">
          <span className="file-card-label">Destino</span>
          <code className="path-chip">{filePath}</code>
        </div>
        <div className="file-card">
          <span className="file-card-label">Status</span>
          <strong>{result.ok ? "JSON valido" : "Revisao pendente"}</strong>
        </div>
      </div>

      <form aria-label="Formulario de Watch Record" className="media-item-form watch-record-form" noValidate onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>Registro</legend>
          <div className="form-grid">
            <MediaIdSelector error={result.errors} filteredMediaItems={filteredMediaItems} hasExistingMedia={selectorItems.length > 0} manualMediaId={form.manualMediaId} mediaSearch={mediaSearch} mode={form.mediaIdMode} onManualMediaIdChange={updateManualMediaId} onMediaSearchChange={setMediaSearch} onModeChange={updateMediaIdMode} onSelectedMediaIdChange={updateSelectedMediaId} onTouched={markTouched} resolvedMediaId={resolvedMediaId} selectedMedia={selectedMedia} selectedMediaId={form.selectedMediaId} touched={touched}/>
            <TextField error={getVisibleError("year", result.errors, touched, form.year)} inputMode="numeric" label="Ano" name="year" onBlur={() => markTouched("year")} onChange={(value) => updateField("year", value)} required value={form.year}/>
            <SelectField error={getVisibleError("unitType", result.errors, touched, form.unitType)} label="Tipo de unidade" name="unitType" onBlur={() => markTouched("unitType")} onChange={updateUnitType} options={WATCH_UNIT_OPTIONS} required value={form.unitType}/>
            <SelectField error={getVisibleError("watchStatus", result.errors, touched, form.watchStatus)} label="Status pessoal" name="watchStatus" onBlur={() => markTouched("watchStatus")} onChange={(value) => updateField("watchStatus", value)} options={WATCH_STATUS_OPTIONS} required value={form.watchStatus}/>
            {unitSuggestion ? <UnitSuggestion selectedUnitType={form.unitType} suggestion={unitSuggestion}/> : null}
          </div>
        </fieldset>

        {form.unitType === "season" ? (<fieldset className="form-section">
            <legend>Unidade</legend>
            <div className="form-grid">
              <TextField error={getVisibleError("seasonNumber", result.errors, touched, form.seasonNumber)} inputMode="numeric" label="Temporada" name="seasonNumber" onBlur={() => markTouched("seasonNumber")} onChange={(value) => updateField("seasonNumber", value)} required value={form.seasonNumber}/>
            </div>
          </fieldset>) : null}

        {form.unitType === "episode" ? (<fieldset className="form-section">
            <legend>Unidade</legend>
            <div className="form-grid">
              <TextField error={getVisibleError("episodeNumber", result.errors, touched, form.episodeNumber)} inputMode="numeric" label="Episodio" name="episodeNumber" onBlur={() => markTouched("episodeNumber")} onChange={(value) => updateField("episodeNumber", value)} required value={form.episodeNumber}/>
              <TextField error={getVisibleError("episodeSeasonNumber", result.errors, touched, form.episodeSeasonNumber)} inputMode="numeric" label="Temporada do episodio" name="episodeSeasonNumber" onBlur={() => markTouched("episodeSeasonNumber")} onChange={(value) => updateField("episodeSeasonNumber", value)} value={form.episodeSeasonNumber}/>
            </div>
          </fieldset>) : null}

        {form.unitType === "arc" ? (<fieldset className="form-section">
            <legend>Unidade</legend>
            <div className="form-grid">
              <TextField error={getVisibleError("arcName", result.errors, touched, form.arcName)} label="Nome do arco" name="arcName" onBlur={() => markTouched("arcName")} onChange={(value) => updateField("arcName", value)} required value={form.arcName}/>
            </div>
          </fieldset>) : null}

        <fieldset className="form-section">
          <legend>Datas e origem</legend>
          <div className="form-grid">
            <TextField error={getVisibleError("startedAt", result.errors, touched, form.startedAt)} label="Inicio" name="startedAt" onBlur={() => markTouched("startedAt")} onChange={(value) => updateField("startedAt", value)} type="date" value={form.startedAt}/>
            <TextField error={getVisibleError("finishedAt", result.errors, touched, form.finishedAt)} label="Fim" name="finishedAt" onBlur={() => markTouched("finishedAt")} onChange={(value) => updateField("finishedAt", value)} type="date" value={form.finishedAt}/>
            <TextField label="Plataforma" name="platform" onBlur={() => undefined} onChange={(value) => updateField("platform", value)} value={form.platform}/>
            <TextField error={getVisibleError("rating", result.errors, touched, form.rating)} inputMode="decimal" label="Rating" name="rating" onBlur={() => markTouched("rating")} onChange={(value) => updateField("rating", value)} value={form.rating}/>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Marcadores</legend>
          <div className="form-grid">
            <CheckboxField checked={form.rewatch} label="Rewatch" name="rewatch" onChange={(value) => updateBooleanField("rewatch", value)}/>
            <CheckboxField checked={form.favorite} label="Favorito" name="favorite" onChange={(value) => updateBooleanField("favorite", value)}/>
            <TextAreaField label="Notas" name="notes" onChange={(value) => updateField("notes", value)} value={form.notes}/>
          </div>
        </fieldset>

        <button className="action-button form-check-button" type="submit">
          Revisar campos
        </button>
      </form>

      {result.ok ? (<JsonOutputBlock description="Watch Record pronto para copiar ou baixar. Salvar em data/history, commitar e enviar ao GitHub continuam manuais." file={result.file} title="Preview de Watch Record" value={result.value}/>) : (<article className="json-output-block form-output-placeholder" role="status">
          <div className="json-output-header">
            <div>
              <span className="file-card-label">Preview bloqueado</span>
              <h2>Watch Record incompleto</h2>
              <p>
                {previewErrorCount === 1
                ? "Revise 1 campo para liberar o JSON valido."
                : `Revise ${previewErrorCount} campos para liberar o JSON valido.`}{" "}
                O preview, a copia e o download ficam indisponiveis enquanto o
                arquivo nao puder ser gerado. Nenhum arquivo foi criado.
              </p>
            </div>
          </div>
        </article>)}
    </div>);
}

function MediaIdSelector({
    error,
    filteredMediaItems,
    hasExistingMedia,
    manualMediaId,
    mediaSearch,
    mode,
    onManualMediaIdChange,
    onMediaSearchChange,
    onModeChange,
    onSelectedMediaIdChange,
    onTouched,
    resolvedMediaId,
    selectedMedia,
    selectedMediaId,
    touched
}) {
    const selectedMediaError = getVisibleError("selectedMediaId", error, touched, selectedMediaId);
    const manualMediaError = getVisibleError("manualMediaId", error, touched, manualMediaId);
    const mediaOptions = filteredMediaItems.map((mediaItem) => ({
        value: mediaItem.id,
        label: `${mediaItem.title} - ${mediaItem.id}`
    }));

    return (<div className="form-field form-field-wide media-id-selector">
      <div className="media-id-selector-header">
        <span className="form-label-text" id="media-id-source-label">
          Media ID <span aria-hidden="true">*</span>
        </span>
        <code>{resolvedMediaId || "sem media_id"}</code>
      </div>

      <div aria-describedby={error.mediaIdMode ? "mediaIdMode-error" : undefined} aria-labelledby="media-id-source-label" className="media-id-mode-grid" role="radiogroup">
        {MEDIA_ID_MODE_OPTIONS.map((option) => {
            const disabled = option.value === "existing" && !hasExistingMedia;

            return (<label className={disabled ? "media-id-mode-option is-disabled" : "media-id-mode-option"} key={option.value}>
              <input checked={mode === option.value} disabled={disabled} name="mediaIdMode" onChange={() => onModeChange(option.value)} type="radio" value={option.value}/>
              <span>{option.label}</span>
              <small>{option.description}</small>
            </label>);
        })}
      </div>
      <FieldError id="mediaIdMode-error" message={error.mediaIdMode}/>

      {mode === "existing" ? (<div className="media-id-source-panel">
          <TextField label="Buscar midia" name="mediaSearch" onBlur={() => undefined} onChange={onMediaSearchChange} value={mediaSearch}/>
          <SelectField error={selectedMediaError} label="Midia existente" name="selectedMediaId" onBlur={() => onTouched("selectedMediaId")} onChange={onSelectedMediaIdChange} options={mediaOptions} required value={selectedMediaId}/>
          {filteredMediaItems.length === 0 ? (<p className="selector-empty-state" role="status">
              Nenhuma midia encontrada para esse filtro.
            </p>) : null}
          {selectedMedia ? <SelectedMediaSummary mediaItem={selectedMedia}/> : null}
        </div>) : (<div className="media-id-source-panel">
          <TextField error={manualMediaError} label="Media ID manual" name="manualMediaId" onBlur={() => onTouched("manualMediaId")} onChange={onManualMediaIdChange} required value={manualMediaId}/>
        </div>)}
    </div>);
}

function SelectedMediaSummary({ mediaItem }) {
    return (<dl aria-label="Midia selecionada" className="selected-media-summary">
      <div>
        <dt>Titulo</dt>
        <dd>{mediaItem.title}</dd>
      </div>
      <div>
        <dt>ID usado</dt>
        <dd><code>{mediaItem.id}</code></dd>
      </div>
      <div>
        <dt>Formato</dt>
        <dd>{mediaItem.format}</dd>
      </div>
      <div>
        <dt>Categoria</dt>
        <dd>{mediaItem.category}</dd>
      </div>
    </dl>);
}

function UnitSuggestion({ selectedUnitType, suggestion }) {
    const status = selectedUnitType === suggestion.value ? "aplicada" : "disponivel";

    return (<p className="unit-suggestion">
      Sugestao da midia: <strong>{suggestion.label}</strong> ({status}). O
      tipo de unidade continua editavel para excecoes validas.
    </p>);
}

function TextField({ error, inputMode, label, name, onBlur, onChange, required, type = "text", value }) {
    return (<div className="form-field">
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} id={name} inputMode={inputMode} name={name} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value}/>
      <FieldError id={`${name}-error`} message={error}/>
    </div>);
}

function SelectField({ error, label, name, onBlur, onChange, options, required, value }) {
    return (<div className="form-field">
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <select aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} id={name} name={name} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option value="">Selecione</option>
        {options.map((option) => (<option key={option.value} value={option.value}>
            {option.label}
          </option>))}
      </select>
      <FieldError id={`${name}-error`} message={error}/>
    </div>);
}

function CheckboxField({ checked, label, name, onChange }) {
    return (<div className="form-field checkbox-field">
      <label htmlFor={name}>
        <input checked={checked} id={name} name={name} onChange={(event) => onChange(event.target.checked)} type="checkbox"/>
        {label}
      </label>
    </div>);
}

function TextAreaField({ label, name, onChange, value }) {
    return (<div className="form-field form-field-wide">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} onChange={(event) => onChange(event.target.value)} rows={4} value={value}/>
    </div>);
}

function FieldError({ id, message }) {
    if (!message) {
        return <span className="field-error field-error-empty" id={id}/>;
    }
    return (<span className="field-error" id={id} role="alert">
      {message}
    </span>);
}

function getVisibleError(field, errors, touched, value) {
    const error = errors[field];
    if (!error) {
        return undefined;
    }
    if (REQUIRED_FIELDS.has(field) || touched[field] || normalizeInput(value)) {
        return error;
    }
    return undefined;
}

function normalizeMediaSelectorItems(mediaItems) {
    return (Array.isArray(mediaItems) ? mediaItems : [])
        .filter((mediaItem) => typeof mediaItem?.id === "string" && mediaItem.id.trim())
        .map((mediaItem) => ({
            id: mediaItem.id.trim(),
            title: normalizeInput(mediaItem.title) || mediaItem.id.trim(),
            originalTitle: normalizeInput(mediaItem.originalTitle),
            category: normalizeInput(mediaItem.category),
            format: normalizeInput(mediaItem.format),
            subcategories: Array.isArray(mediaItem.subcategories)
                ? mediaItem.subcategories.filter(Boolean).map(String)
                : [],
            originPath: normalizeInput(mediaItem.origin?.path)
        }))
        .sort(compareMediaSelectorItems);
}

function filterMediaSelectorItems(mediaItems, search, selectedMedia) {
    const query = normalizeSearch(search);
    const matches = query
        ? mediaItems.filter((mediaItem) => mediaItemMatchesQuery(mediaItem, query))
        : mediaItems;

    if (selectedMedia && !matches.some((mediaItem) => mediaItem.id === selectedMedia.id)) {
        return [selectedMedia, ...matches];
    }

    return matches;
}

function mediaItemMatchesQuery(mediaItem, query) {
    return [
        mediaItem.id,
        mediaItem.title,
        mediaItem.originalTitle,
        mediaItem.category,
        mediaItem.format,
        ...mediaItem.subcategories
    ].some((value) => normalizeSearch(value).includes(query));
}

function compareMediaSelectorItems(left, right) {
    return (
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id) ||
        left.originPath.localeCompare(right.originPath)
    );
}

function getUnitSuggestion(mediaItem) {
    const suggestedType = getSuggestedUnitType(mediaItem);

    if (!suggestedType) {
        return null;
    }

    return WATCH_UNIT_OPTIONS.find((option) => option.value === suggestedType) || null;
}

function getSuggestedUnitType(mediaItem) {
    if (!mediaItem) {
        return "";
    }

    if (mediaItem.format === "movie") {
        return "movie";
    }

    if (mediaItem.format === "special") {
        return "special";
    }

    if (mediaItem.format === "short") {
        return "full_work";
    }

    if (mediaItem.format === "series") {
        return mediaItem.subcategories.includes("limited-series") ? "limited_season" : "season";
    }

    return "";
}

function normalizeInput(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeSearch(value) {
    return normalizeInput(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
