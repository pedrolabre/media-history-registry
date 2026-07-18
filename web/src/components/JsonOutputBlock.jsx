import { CopyButton } from "./CopyButton";
import { DownloadButton } from "./DownloadButton";
import { FileInfo } from "./FileInfo";
import { JsonPreview } from "./JsonPreview";
import { buildJsonOutput } from "../utils/jsonGeneration";
export function JsonOutputBlock({ description, file, title, value }) {
    const result = buildJsonOutput(value, file);
    return (<article className="json-output-block">
      <div className="json-output-header">
        <div>
          <span className="file-card-label">Output reutilizavel</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {result.ok ? (<>
          <FileInfo output={result.output}/>
          <JsonPreview json={result.output.json}/>
          <div className="json-actions">
            <CopyButton text={result.output.json}/>
            <DownloadButton output={result.output}/>
          </div>
        </>) : (<p className="json-preview-error" role="alert">
          {result.error}
        </p>)}
    </article>);
}
