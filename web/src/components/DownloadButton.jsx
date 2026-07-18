import { useState } from "react";
import { downloadJsonFile } from "../utils/jsonGeneration";
export function DownloadButton({ output }) {
    const [feedback, setFeedback] = useState("Arquivo local");
    function handleDownload() {
        downloadJsonFile(output);
        setFeedback(output.fileName);
    }
    return (<div className="action-control">
      <button className="action-button action-button-secondary" type="button" onClick={handleDownload}>
        Baixar JSON
      </button>
      <span aria-live="polite" className="action-feedback">
        {feedback}
      </span>
    </div>);
}
