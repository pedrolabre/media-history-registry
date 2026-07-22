import { groupRecordsByMediaId } from "../../data-loader";
import { formatMetricLabel } from "./formatting";
import { CategoryNoRecordsState, MediaNoRecordsState } from "./LibraryStates";
import { LinkedRecordCollection, RecordFact } from "./RecordList";
import { LibraryControls } from "./LibraryControls";
import { FilterNoResultsState } from "./LibraryStates";

export function MediaDetail({ explorer, mediaItem }) {
    const hasRecords = mediaItem.watchRecords.length > 0;
    return (<section className="media-library" aria-labelledby={`media-${mediaItem.id}`}>
      <MediaProfile mediaItem={mediaItem}/>

      {hasRecords ? <LibraryControls explorer={explorer}/> : null}

      {hasRecords && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {hasRecords && explorer.filteredCount > 0 ? (<LinkedRecordCollection records={explorer.records} title="Watch Records ligados"/>) : null}

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
    return (<article className="media-profile">
      <header className="media-profile-heading">
        <div>
          <span className="file-card-label">Media Item</span>
          <h2 id={`media-${mediaItem.id}`}>{mediaItem.title}</h2>
          {mediaItem.originalTitle ? <p>{mediaItem.originalTitle}</p> : null}
        </div>
        <strong>{mediaItem.recordCount}</strong>
      </header>

      <MediaFacts mediaItem={mediaItem}/>
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
