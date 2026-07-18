import { useId, useState } from "react";
import { copyTextToClipboard } from "../utils/jsonGeneration";
export function CopyButton({ text }) {
    const feedbackId = useId();
    const [feedback, setFeedback] = useState("Pronto para copiar");
    async function handleCopy() {
        const result = await copyTextToClipboard(text);
        if (result.ok) {
            setFeedback("JSON copiado");
            return;
        }
        setFeedback(result.message);
    }
    return (<div className="action-control">
      <button aria-describedby={feedbackId} className="action-button" type="button" onClick={handleCopy}>
        Copiar JSON
      </button>
      <span aria-live="polite" className="action-feedback" id={feedbackId}>
        {feedback}
      </span>
    </div>);
}
