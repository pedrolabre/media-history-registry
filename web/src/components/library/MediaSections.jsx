import { groupRecordsByMediaId } from "../../data-loader";
import {
    formatArrayLabel,
    formatMetricLabel,
    formatNumberLabel,
    formatTextLabel
} from "./formatting";
import { CategoryNoRecordsState, MediaNoRecordsState } from "./LibraryStates";
import { LinkedRecordCollection, RecordFact } from "./RecordList";
import { LibraryControls } from "./LibraryControls";
import { FilterNoResultsState } from "./LibraryStates";
import { WatchTimeline } from "./WatchTimeline";

export function MediaDetail({ explorer, mediaItem }) {
    const hasRecords = mediaItem.watchRecords.length > 0;
    return (<section className="media-library media-detail" aria-labelledby={`media-${mediaItem.id}`}>
      <MediaProfile mediaItem={mediaItem}/>

      {hasRecords ? <LibraryControls explorer={explorer} showSorting={false}/> : null}

      {hasRecords && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {hasRecords && explorer.filteredCount > 0 ? (<WatchTimeline records={explorer.records} title="Timeline de Watch Records"/>) : null}

      {!hasRecords ? <MediaNoRecordsState mediaItem={mediaItem}/> : null}
    </section>);
}

export function CategoryDetail({ categoryGroup, explorer }) {
    const hasLinkedRecords = categoryGroup.watchRecordCount > 0;
    const recordsByMediaId = groupRecordsByMediaId(explorer.records);
    const visibleMediaItems = explorer.hasActiveFilters
        ? categoryGroup.mediaItems.filter((mediaItem) => recordsByMediaId.has(mediaItem.id))
        : categoryGroup.mediaItems;
    return (<section className="category-library" aria-labelledby={`category-${categoryGroup.category}`}>
      <header className="category-header">
        <div>
          <span className="file-card-label">Categoria</span>
          <h2 id={`category-${categoryGroup.category}`}>{formatMetricLabel(categoryGroup.category)}</h2>
        </div>
        <p>
          {categoryGroup.mediaItemCount} {categoryGroup.mediaItemCount === 1 ? "midia" : "midias"} /{" "}
          {categoryGroup.watchRecordCount}{" "}
          {categoryGroup.watchRecordCount === 1 ? "registro ligado" : "registros ligados"}
        </p>
      </header>

      {!hasLinkedRecords ? <CategoryNoRecordsState categoryGroup={categoryGroup}/> : null}

      {hasLinkedRecords ? <LibraryControls explorer={explorer}/> : null}

      {hasLinkedRecords && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      <div className="category-media-list">
        {visibleMediaItems.map((mediaItem) => (<CategoryMediaCard filteredRecords={recordsByMediaId.get(mediaItem.id)} key={mediaItem.id} mediaItem={mediaItem}/>))}
      </div>
    </section>);
}

function MediaProfile({ mediaItem }) {
    return (<article className="media-profile media-detail-profile">
      <header className="media-profile-heading">
        <div>
          <span className="file-card-label">Media Item</span>
          <h2 id={`media-${mediaItem.id}`}>{mediaItem.title}</h2>
          {mediaItem.originalTitle ? <p>{mediaItem.originalTitle}</p> : null}
        </div>
        <strong aria-label={`${mediaItem.recordCount} registros ligados`}>
          {mediaItem.recordCount}
        </strong>
      </header>

      <div className={mediaItem.poster ? "media-detail-body media-detail-body-with-poster" : "media-detail-body"}>
        {mediaItem.poster ? (<figure className="media-poster">
            <img alt={`Poster de ${mediaItem.title}`} src={mediaItem.poster}/>
            <figcaption>Poster registrado no Media Item</figcaption>
          </figure>) : null}

        <div className="media-detail-content">
          <MediaDetailFacts mediaItem={mediaItem}/>
          <ExternalIds mediaItem={mediaItem}/>
          {mediaItem.notes ? (<p className="media-detail-note">
              <strong>Notas da obra</strong>
              {mediaItem.notes}
            </p>) : null}
          <MediaOrigin mediaItem={mediaItem}/>
        </div>
      </div>
    </article>);
}

function CategoryMediaCard({ filteredRecords, mediaItem }) {
    const records = filteredRecords || mediaItem.watchRecords;
    return (<article className="category-media-card">
      <header className="category-media-heading">
        <div>
          <span className="file-card-label">Obra</span>
          <h3>{mediaItem.title}</h3>
          {mediaItem.originalTitle ? <p>{mediaItem.originalTitle}</p> : null}
        </div>
        <strong>
          {mediaItem.recordCount} {mediaItem.recordCount === 1 ? "registro" : "registros"}
        </strong>
      </header>

      <MediaFacts mediaItem={mediaItem}/>

      {records.length > 0 ? (<LinkedRecordCollection compact records={records} title="Registros da obra"/>) : (<MediaNoRecordsState compact mediaItem={mediaItem}/>)}
    </article>);
}

function MediaFacts({ mediaItem }) {
    const subcategories =
        mediaItem.subcategories.length > 0
            ? mediaItem.subcategories.map(formatMetricLabel).join(", ")
            : "sem subcategorias";
    return (<dl className="media-fact-grid">
      <RecordFact label="Categoria" value={formatMetricLabel(mediaItem.category)}/>
      <RecordFact label="Subcategorias" value={subcategories}/>
      <RecordFact label="Formato" value={formatMetricLabel(mediaItem.format)}/>
      <RecordFact label="Producao" value={formatMetricLabel(mediaItem.productionStatus)}/>
      <RecordFact label="Primeiro lancamento" value={mediaItem.firstReleaseYear || "nao informado"}/>
      <RecordFact label="Registros" value={mediaItem.recordCount}/>
    </dl>);
}

function MediaDetailFacts({ mediaItem }) {
    return (<dl className="media-fact-grid media-detail-facts">
      <RecordFact label="Categoria" value={formatMetricLabel(mediaItem.category)}/>
      <RecordFact
        label="Subcategorias"
        value={formatArrayLabel(mediaItem.subcategories, "sem subcategorias")}
      />
      <RecordFact label="Formato" value={formatMetricLabel(mediaItem.format)}/>
      <RecordFact label="Status da obra" value={formatMetricLabel(mediaItem.productionStatus)}/>
      <RecordFact label="Generos" value={formatArrayLabel(mediaItem.genres, "sem generos")}/>
      <RecordFact label="Paises" value={formatArrayLabel(mediaItem.countries, "nao informado", String)}/>
      <RecordFact label="Estudios" value={formatArrayLabel(mediaItem.studios, "nao informado", String)}/>
      <RecordFact label="Diretores" value={formatArrayLabel(mediaItem.directors, "nao informado", String)}/>
      <RecordFact label="Primeiro ano" value={formatNumberLabel(mediaItem.firstReleaseYear)}/>
      <RecordFact label="Registros ligados" value={mediaItem.recordCount}/>
    </dl>);
}

function ExternalIds({ mediaItem }) {
    const externalIds = mediaItem.externalIds || {};
    const entries = [
        ["imdb", externalIds.imdb],
        ["tmdb", externalIds.tmdb],
        ["anilist", externalIds.anilist],
        ["myanimelist", externalIds.myanimelist]
    ];

    return (<section className="media-external-ids" aria-label="External IDs">
      <h3>External IDs</h3>
      <dl className="media-fact-grid">
        {entries.map(([key, value]) => (<RecordFact
            key={key}
            label={formatExternalIdLabel(key)}
            value={formatTextLabel(value === null || value === undefined ? null : String(value))}
          />))}
      </dl>
    </section>);
}

function MediaOrigin({ mediaItem }) {
    return (<section className="media-origin" aria-label="Origem do Media Item">
      <h3>Origem</h3>
      <dl className="source-ledger">
        <RecordFact label="Path" value={mediaItem.origin.path}/>
        <RecordFact label="Arquivo" value={mediaItem.origin.filename}/>
        <RecordFact label="Categoria do path" value={mediaItem.origin.category}/>
        <RecordFact label="ID do arquivo" value={mediaItem.origin.fileId}/>
      </dl>
    </section>);
}

function formatExternalIdLabel(value) {
    if (value === "myanimelist") {
        return "MyAnimeList";
    }

    return String(value).toUpperCase();
}
