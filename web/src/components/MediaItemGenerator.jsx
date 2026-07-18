import { useMemo, useState } from "react";
import { JsonOutputBlock } from "./JsonOutputBlock";
import { MEDIA_CATEGORY_OPTIONS, MEDIA_FORMAT_OPTIONS, MEDIA_STATUS_OPTIONS, buildMediaItemGeneratorOutput, initialMediaItemFormState } from "../utils/mediaItemGenerator";
const REQUIRED_FIELDS = new Set(["title", "category", "format", "status"]);
export function MediaItemGenerator() {
    const [form, setForm] = useState(initialMediaItemFormState);
    const [touched, setTouched] = useState({});
    const result = useMemo(() => buildMediaItemGeneratorOutput(form), [form]);
    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value
        }));
    }
    function updateExternalId(field, value) {
        setForm((current) => ({
            ...current,
            externalIds: {
                ...current.externalIds,
                [field]: value
            }
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
            title: true,
            category: true,
            format: true,
            status: true,
            subcategories: true,
            genres: true,
            countries: true,
            firstReleaseYear: true,
            "externalIds.imdb": true,
            "externalIds.tmdb": true,
            "externalIds.anilist": true,
            "externalIds.myanimelist": true
        });
    }
    const filePath = result.ok ? result.file.repositoryPath : "data/media/{category}/{slug}.json";
    const previewErrorCount = Object.keys(result.errors).length;
    return (<div className="media-generator">
      <div className="generated-summary" aria-label="Resumo do Media Item" role="group">
        <div className="file-card">
          <span className="file-card-label">ID gerado</span>
          <strong>{result.id || "aguardando titulo"}</strong>
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

      <form aria-label="Formulario de Media Item" className="media-item-form" noValidate onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>Identidade</legend>
          <div className="form-grid">
            <TextField error={getVisibleError("title", result.errors, touched, form.title)} label="Titulo" name="title" onBlur={() => markTouched("title")} onChange={(value) => updateField("title", value)} required value={form.title}/>
            <TextField error={getVisibleError("originalTitle", result.errors, touched, form.originalTitle)} label="Titulo original" name="originalTitle" onBlur={() => markTouched("originalTitle")} onChange={(value) => updateField("originalTitle", value)} value={form.originalTitle}/>
            <SelectField error={getVisibleError("category", result.errors, touched, form.category)} label="Categoria" name="category" onBlur={() => markTouched("category")} onChange={(value) => updateField("category", value)} options={MEDIA_CATEGORY_OPTIONS} required value={form.category}/>
            <SelectField error={getVisibleError("format", result.errors, touched, form.format)} label="Formato" name="format" onBlur={() => markTouched("format")} onChange={(value) => updateField("format", value)} options={MEDIA_FORMAT_OPTIONS} required value={form.format}/>
            <SelectField error={getVisibleError("status", result.errors, touched, form.status)} label="Status" name="status" onBlur={() => markTouched("status")} onChange={(value) => updateField("status", value)} options={MEDIA_STATUS_OPTIONS} required value={form.status}/>
            <TextField error={getVisibleError("firstReleaseYear", result.errors, touched, form.firstReleaseYear)} inputMode="numeric" label="Ano inicial" name="firstReleaseYear" onBlur={() => markTouched("firstReleaseYear")} onChange={(value) => updateField("firstReleaseYear", value)} value={form.firstReleaseYear}/>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Classificacao</legend>
          <div className="form-grid">
            <TextField error={getVisibleError("subcategories", result.errors, touched, form.subcategories)} label="Subcategorias" name="subcategories" onBlur={() => markTouched("subcategories")} onChange={(value) => updateField("subcategories", value)} value={form.subcategories}/>
            <TextField error={getVisibleError("genres", result.errors, touched, form.genres)} label="Generos" name="genres" onBlur={() => markTouched("genres")} onChange={(value) => updateField("genres", value)} value={form.genres}/>
            <TextField error={getVisibleError("countries", result.errors, touched, form.countries)} label="Paises" name="countries" onBlur={() => markTouched("countries")} onChange={(value) => updateField("countries", value)} value={form.countries}/>
            <TextField label="Studios" name="studios" onBlur={() => markTouched("studios")} onChange={(value) => updateField("studios", value)} value={form.studios}/>
            <TextField label="Diretores" name="directors" onBlur={() => markTouched("directors")} onChange={(value) => updateField("directors", value)} value={form.directors}/>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>IDs externos</legend>
          <div className="form-grid">
            <TextField error={getVisibleError("externalIds.imdb", result.errors, touched, form.externalIds.imdb)} label="IMDB" name="imdb" onBlur={() => markTouched("externalIds.imdb")} onChange={(value) => updateExternalId("imdb", value)} value={form.externalIds.imdb}/>
            <TextField error={getVisibleError("externalIds.tmdb", result.errors, touched, form.externalIds.tmdb)} inputMode="numeric" label="TMDB" name="tmdb" onBlur={() => markTouched("externalIds.tmdb")} onChange={(value) => updateExternalId("tmdb", value)} value={form.externalIds.tmdb}/>
            <TextField error={getVisibleError("externalIds.anilist", result.errors, touched, form.externalIds.anilist)} inputMode="numeric" label="AniList" name="anilist" onBlur={() => markTouched("externalIds.anilist")} onChange={(value) => updateExternalId("anilist", value)} value={form.externalIds.anilist}/>
            <TextField error={getVisibleError("externalIds.myanimelist", result.errors, touched, form.externalIds.myanimelist)} inputMode="numeric" label="MyAnimeList" name="myanimelist" onBlur={() => markTouched("externalIds.myanimelist")} onChange={(value) => updateExternalId("myanimelist", value)} value={form.externalIds.myanimelist}/>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Notas</legend>
          <div className="form-grid">
            <TextField label="Poster" name="poster" onBlur={() => markTouched("poster")} onChange={(value) => updateField("poster", value)} value={form.poster}/>
            <TextAreaField label="Notas" name="notes" onBlur={() => markTouched("notes")} onChange={(value) => updateField("notes", value)} value={form.notes}/>
          </div>
        </fieldset>

        <button className="action-button form-check-button" type="submit">
          Revisar campos
        </button>
      </form>

      {result.ok ? (<JsonOutputBlock description="Media Item pronto para copiar ou baixar. Salvar em data/media, commitar e enviar ao GitHub continuam manuais." file={result.file} title="Preview de Media Item" value={result.value}/>) : (<article className="json-output-block form-output-placeholder" role="status">
          <div className="json-output-header">
            <div>
              <span className="file-card-label">Preview bloqueado</span>
              <h2>Media Item incompleto</h2>
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
function TextField({ error, inputMode, label, name, onBlur, onChange, required, value }) {
    return (<div className="form-field">
      <label htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} id={name} inputMode={inputMode} name={name} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} required={required} type="text" value={value}/>
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
function TextAreaField({ label, name, onBlur, onChange, value }) {
    return (<div className="form-field form-field-wide">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} rows={4} value={value}/>
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
