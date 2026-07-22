export function LibrarySummary({ data }) {
    const relationships = data.normalized.relationships;
    return (<div className="library-metrics" aria-label="Resumo da biblioteca">
      <MetricCard detail="data/media" label="Media Items" value={data.counts.mediaItems}/>
      <MetricCard detail="data/history" label="Watch Records" value={data.counts.watchRecords}/>
      <MetricCard detail="anos carregados" label="Anos" value={data.normalized.yearGroups.length}/>
      <MetricCard detail="media_id ausente" label="Orfaos" value={relationships.orphanWatchRecords}/>
    </div>);
}

function MetricCard({ detail, label, value }) {
    return (<article className="library-metric" aria-label={`${label}: ${value}`}>
      <span className="file-card-label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>);
}
