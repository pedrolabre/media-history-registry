import { useId, useState } from "react";
import { downloadJsonFile } from "../utils/jsonGeneration";
export function DownloadButton({ output }) {
    const feedbackId = useId();
    const [feedback, setFeedback] = useState("Pronto para baixar. O destino no repositorio continua manual.");
    function handleDownload() {
        downloadJsonFile(output);
        setFeedback(`Download acionado: ${output.fileName}. Salve no caminho indicado e faca commit manual.`);
    }
    return (<div className="action-control">
      <button aria-describedby={feedbackId} className="action-button action-button-secondary" type="button" onClick={handleDownload}>
        Baixar JSON
      </button>
      <span aria-live="polite" className="action-feedback" id={feedbackId}>
        {feedback}
      </span>
    </div>);
}
