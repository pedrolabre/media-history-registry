export function JsonPreview({ json }) {
    return (<pre className="json-preview" aria-label="Preview JSON">
      <code>{json}</code>
    </pre>);
}
