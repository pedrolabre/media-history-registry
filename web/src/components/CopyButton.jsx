import { useId, useState } from "react";
import { copyTextToClipboard } from "../utils/jsonGeneration";
export function CopyButton({ text }) {
    const feedbackId = useId();
    const [feedback, setFeedback] = useState("Pronto para copiar. Depois cole e salve manualmente.");
    async function handleCopy() {
        const result = await copyTextToClipboard(text);
        if (result.ok) {
            setFeedback("JSON copiado. O app nao salvou arquivo, nao fez commit e nao escreveu no GitHub.");
            return;
        }
        setFeedback(`${result.message} Selecione o preview e copie manualmente.`);
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
