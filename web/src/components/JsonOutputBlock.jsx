import { useId } from "react";
import { CopyButton } from "./CopyButton";
import { DownloadButton } from "./DownloadButton";
import { FileInfo } from "./FileInfo";
import { JsonPreview } from "./JsonPreview";
import { buildJsonOutput } from "../utils/jsonGeneration";
export function JsonOutputBlock({ description, file, title, value }) {
    const titleId = useId();
    const result = buildJsonOutput(value, file);
    return (<article className="json-output-block" aria-labelledby={titleId}>
      <div className="json-output-header">
        <div>
          <span className="file-card-label">Output reutilizavel</span>
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
          <p className="json-output-manual-note">
            Copiar ou baixar entrega o conteudo do arquivo; salvar no
            repositorio, commitar e enviar para o GitHub continuam manuais.
          </p>
        </div>
      </div>

      {result.ok ? (<>
          <FileInfo output={result.output}/>
          <JsonPreview json={result.output.json}/>
          <div className="json-actions">
            <CopyButton text={result.output.json}/>
            <DownloadButton output={result.output}/>
          </div>
        </>) : (<div className="json-preview-error" role="alert">
          <strong>JSON nao gerado</strong>
          <span>
            Nao foi possivel montar o arquivo a partir dos dados atuais. Revise
            os campos; nenhum arquivo foi salvo no repositorio.
          </span>
          <code>{result.error}</code>
        </div>)}
    </article>);
}
