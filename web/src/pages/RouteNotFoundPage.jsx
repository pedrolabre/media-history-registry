export function RouteNotFoundPage() {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Rota nao registrada</span>
        <h2>Este endereco nao abre uma gaveta conhecida</h2>
        <p>
          A aplicacao nao criou, moveu ou salvou nada. Volte para a biblioteca
          completa e escolha uma rota do mapa atual.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/library">
          Abrir biblioteca
        </a>
      </div>
    </article>);
}
