export function JsonPreview({ json }) {
    return (<pre className="json-preview" aria-label="Preview JSON gerado, ainda nao salvo no repositorio" role="region" tabIndex={0}>
      <code>{json}</code>
    </pre>);
}
