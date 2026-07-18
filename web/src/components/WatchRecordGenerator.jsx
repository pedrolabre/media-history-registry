import { useMemo, useState } from "react";
import { JsonOutputBlock } from "./JsonOutputBlock";
import { WATCH_STATUS_OPTIONS, WATCH_UNIT_OPTIONS, buildWatchRecordGeneratorOutput, createInitialWatchRecordFormState } from "../utils/watchRecordGenerator";
const REQUIRED_FIELDS = new Set([
    "mediaId",
    "year",
    "unitType",
    "seasonNumber",
    "episodeNumber",
    "arcName",
    "watchStatus"
]);
export function WatchRecordGenerator() {
    const [form, setForm] = useState(createInitialWatchRecordFormState);
    const [touched, setTouched] = useState({});
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
    function markTouched(field) {
        setTouched((current) => ({
            ...current,
            [field]: true
        }));
    }
    function handleSubmit(event) {
        event.preventDefault();
        setTouched({
            mediaId: true,
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
          <strong>{result.ok ? "JSON pronto" : "Campos pendentes"}</strong>
        </div>
      </div>

      <form aria-label="Formulario de Watch Record" className="media-item-form watch-record-form" noValidate onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>Registro</legend>
          <div className="form-grid">
            <TextField error={getVisibleError("mediaId", result.errors, touched, form.mediaId)} label="Media ID" name="mediaId" onBlur={() => markTouched("mediaId")} onChange={(value) => updateField("mediaId", value)} required value={form.mediaId}/>
            <TextField error={getVisibleError("year", result.errors, touched, form.year)} inputMode="numeric" label="Ano" name="year" onBlur={() => markTouched("year")} onChange={(value) => updateField("year", value)} required value={form.year}/>
            <SelectField error={getVisibleError("unitType", result.errors, touched, form.unitType)} label="Tipo de unidade" name="unitType" onBlur={() => markTouched("unitType")} onChange={(value) => updateField("unitType", value)} options={WATCH_UNIT_OPTIONS} required value={form.unitType}/>
            <SelectField error={getVisibleError("watchStatus", result.errors, touched, form.watchStatus)} label="Status pessoal" name="watchStatus" onBlur={() => markTouched("watchStatus")} onChange={(value) => updateField("watchStatus", value)} options={WATCH_STATUS_OPTIONS} required value={form.watchStatus}/>
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

      {result.ok ? (<JsonOutputBlock description="Arquivo pronto para copiar ou baixar e salvar manualmente no repositorio." file={result.file} title="Preview de Watch Record" value={result.value}/>) : (<article className="json-output-block form-output-placeholder" role="status">
          <div className="json-output-header">
            <div>
              <span className="file-card-label">Preview bloqueado</span>
              <h2>Watch Record incompleto</h2>
              <p>
                {previewErrorCount === 1
                ? "Corrija 1 campo para liberar o JSON."
                : `Corrija ${previewErrorCount} campos para liberar o JSON.`}
              </p>
            </div>
          </div>
        </article>)}
    </div>);
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
    if (REQUIRED_FIELDS.has(field) || touched[field] || value.trim()) {
        return error;
    }
    return undefined;
}
