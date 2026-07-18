export function JsonPreview({ json }) {
    return (<pre className="json-preview" aria-label="Preview JSON" role="region" tabIndex={0}>
      <code>{json}</code>
    </pre>);
}
