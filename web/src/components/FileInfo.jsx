export function FileInfo({ output }) {
    return (<dl className="json-file-info" aria-label="Informacoes do arquivo gerado">
      <div>
        <dt>Nome</dt>
        <dd>
          <code>{output.fileName}</code>
        </dd>
      </div>
      <div>
        <dt>Caminho</dt>
        <dd>
          <code>{output.repositoryPath}</code>
        </dd>
      </div>
      <div>
        <dt>MIME</dt>
        <dd>{output.mimeType}</dd>
      </div>
      <div>
        <dt>Tamanho</dt>
        <dd>{output.sizeLabel}</dd>
      </div>
    </dl>);
}
