import { useMemo } from "react";
import { sortTimelineWatchRecords } from "../../data-loader";
import {
    formatBooleanLabel,
    formatDateLabel,
    formatMetricLabel,
    formatNumberLabel
} from "./formatting";
import { RecordFact } from "./RecordList";

export function WatchTimeline({ records, title = "Timeline de consumo" }) {
    const sortedRecords = useMemo(
        () => [...(Array.isArray(records) ? records : [])].sort(sortTimelineWatchRecords),
        [records]
    );

    return (<section className="watch-timeline" aria-label={title}>
      <header className="watch-timeline-header">
        <div>
          <span className="file-card-label">Timeline</span>
          <h2>{title}</h2>
          <p>
            Ordem cronologica derivada por ano, datas, unidade e identificador
            estavel. Nada aqui e salvo nos JSONs primarios.
          </p>
        </div>
        <strong>
          {sortedRecords.length} {sortedRecords.length === 1 ? "registro" : "registros"}
        </strong>
      </header>

      <ol className="watch-timeline-list">
        {sortedRecords.map((record) => (<TimelineRecord key={record.id} record={record}/>))}
      </ol>
    </section>);
}

function TimelineRecord({ record }) {
    return (<li className="watch-timeline-item">
      <article className="watch-timeline-card">
        <header className="watch-timeline-card-header">
          <div>
            <span>{record.year}</span>
            <h3>{formatMetricLabel(record.watchStatus)}</h3>
            <p>
              <code>{record.id}</code>
            </p>
          </div>
          <strong className="year-record-unit">{record.unitLabel}</strong>
        </header>

        <dl className="year-record-facts watch-timeline-facts">
          <RecordFact label="Ano" value={record.year}/>
          <RecordFact label="Unidade" value={describeUnit(record.unit)}/>
          <RecordFact label="Status pessoal" value={formatMetricLabel(record.watchStatus)}/>
          <RecordFact label="Inicio" value={formatDateLabel(record.startedAt)}/>
          <RecordFact label="Fim" value={formatDateLabel(record.finishedAt)}/>
          {record.platform ? <RecordFact label="Plataforma" value={record.platform}/> : null}
          <RecordFact label="Rewatch" value={formatBooleanLabel(record.rewatch)}/>
          <RecordFact label="Favorito" value={formatBooleanLabel(record.favorite)}/>
          {record.rating !== null ? <RecordFact label="Rating" value={formatNumberLabel(record.rating)}/> : null}
        </dl>

        {record.notes ? (<p className="watch-timeline-notes">
            <strong>Notas</strong>
            {record.notes}
          </p>) : null}
      </article>
    </li>);
}

function describeUnit(unit) {
    if (!unit || typeof unit.type !== "string") {
        return "nao informada";
    }

    switch (unit.type) {
        case "season":
            return `Temporada ${formatUnitNumber(unit.season_number)}`;
        case "limited_season":
            return "Temporada limitada";
        case "episode":
            return unit.season_number
                ? `Temporada ${formatUnitNumber(unit.season_number)}, episodio ${formatUnitNumber(unit.episode_number)}`
                : `Episodio ${formatUnitNumber(unit.episode_number)}`;
        case "arc":
            return unit.arc_name ? `Arco ${unit.arc_name}` : "Arco";
        case "movie":
            return "Filme";
        case "special":
            return "Especial";
        case "full_work":
            return "Obra completa";
        case "unspecified":
            return "nao especificada";
        default:
            return "nao informada";
    }
}

function formatUnitNumber(value) {
    return Number.isInteger(value) ? value : "nao informado";
}
