import { formatMetricLabel } from "./formatting";

export function MediaNotFoundState({ mediaId }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Midia inexistente</span>
        <h2>Nenhuma obra encontrada</h2>
        <p>
          O snapshot atual nao encontrou Media Item com id{" "}
          <code>{mediaId}</code> em <code>data/media</code>.
        </p>
        <p>
          Para recuperar este recorte, gere ou adicione um Media Item com esse
          id, salve o arquivo no repositorio e faca o commit manualmente.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/library">
          Ver biblioteca completa
        </a>
        <a className="inline-action" data-app-link href="/generate/media">
          Gerar Media Item
        </a>
      </div>
    </article>);
}

export function MediaNoRecordsState({ compact = false, mediaItem }) {
    if (compact) {
        return (<p className="compact-empty-state" role="status">
          <strong>Sem Watch Records ligados.</strong> Nenhum registro referencia{" "}
          <code>{mediaItem.id}</code> neste snapshot. Adicione um Watch Record
          com esse media_id para ligar a obra no proximo build.
        </p>);
    }

    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Midia sem registros</span>
        <h2>Nenhum Watch Record ligado</h2>
        <p>
          {mediaItem.title} existe como Media Item, mas nenhum Watch Record
          referencia <code>{mediaItem.id}</code> neste snapshot.
        </p>
        <p>
          O proximo passo possivel e gerar ou adicionar um Watch Record usando
          esse media_id, salvar o arquivo em <code>data/history</code> e fazer
          o commit manual.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/generate/watch-record">
          Gerar Watch Record
        </a>
      </div>
    </article>);
}

export function CategoryNoMediaState({ category }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Categoria sem midias</span>
        <h2>Nenhuma midia em {formatMetricLabel(category)}</h2>
        <p>
          O snapshot atual nao encontrou Media Items em{" "}
          <code>data/media/{category}</code>.
        </p>
        <p>
          Para preencher esta categoria, gere ou adicione um Media Item, salve
          no caminho indicado e commite manualmente.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/library">
          Ver biblioteca completa
        </a>
        <a className="inline-action" data-app-link href="/generate/media">
          Gerar Media Item
        </a>
      </div>
    </article>);
}

export function CategoryNoRecordsState({ categoryGroup }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Categoria sem registros</span>
        <h2>Nenhum Watch Record ligado</h2>
        <p>
          A categoria {formatMetricLabel(categoryGroup.category)} possui{" "}
          {categoryGroup.mediaItemCount}{" "}
          {categoryGroup.mediaItemCount === 1 ? "Media Item" : "Media Items"},
          mas ainda nao possui Watch Records ligados.
        </p>
        <p>
          A categoria ja tem obras cadastradas. Para aparecer na biblioteca de
          consumo, adicione Watch Records que referenciem esses media_id e faca
          o commit manualmente.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/generate/watch-record">
          Gerar Watch Record
        </a>
      </div>
    </article>);
}

export function YearEmptyState({ hasLibraryRecords, year }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Ano vazio</span>
        <h2>Nenhum registro em {year}</h2>
        <p>
          {hasLibraryRecords
            ? `A biblioteca possui registros em outros anos, mas nenhum Watch Record foi encontrado para ${year}. Se este ano deve existir, adicione um arquivo em data/history/${year} e faca o commit manual.`
            : "O snapshot atual ainda nao encontrou Watch Records em data/history. Gere ou adicione um registro, salve o arquivo no repositorio e faca o commit manual."}
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/library">
          Ver biblioteca completa
        </a>
        <a className="inline-action" data-app-link href="/generate/watch-record">
          Gerar Watch Record
        </a>
      </div>
    </article>);
}

export function LoaderErrorState({ data }) {
    return (<article className="loader-state loader-state-error" role="alert">
      <div>
        <span className="file-card-label">Loader</span>
        <h2>Carregamento parcial</h2>
        <p>
          O app manteve os dados que conseguiu carregar, mas alguns paths
          precisam de revisao. Ajuste os caminhos listados, salve a correcao no
          repositorio e rode um novo build; nenhum JSON foi alterado pela
          aplicacao.
        </p>
      </div>
      <ul className="loader-error-list">
        {data.errors.map((error) => (<li key={`${error.path}-${error.message}`}>
            <code>{error.path}</code>
            <span>{error.message} Acao possivel: revisar o caminho do arquivo.</span>
          </li>))}
      </ul>
    </article>);
}

export function LibraryEmptyState() {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Biblioteca vazia</span>
        <h2>Nenhum registro carregado</h2>
        <p>
          O snapshot atual ainda nao encontrou Watch Records em{" "}
          <code>data/history</code>. Media Items podem existir, mas a
          biblioteca por ano nasce dos registros de consumo.
        </p>
        <p>
          Use o gerador para copiar ou baixar um Watch Record, salve o JSON no
          caminho indicado e faca o commit manual. O app nao salva no
          repositorio nem escreve no GitHub.
        </p>
      </div>
      <div className="loader-state-actions">
        <a className="inline-action" data-app-link href="/generate/watch-record">
          Gerar Watch Record
        </a>
      </div>
    </article>);
}

export function FilterNoResultsState({ explorer }) {
    const hiddenRecordsText =
        explorer.totalCount === 1
            ? "o registro disponivel."
            : `todos os ${explorer.totalCount} registros disponiveis.`;
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Sem resultados</span>
        <h2>Nenhum Watch Record neste recorte</h2>
        <p>
          Os filtros ativos ocultaram {hiddenRecordsText} Ajuste ou limpe os
          filtros para ver o snapshot de novo; nenhum registro foi removido.
        </p>
      </div>
    </article>);
}
