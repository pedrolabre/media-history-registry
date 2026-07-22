import { formatMetricLabel } from "./formatting";

export function LinkedRecordCollection({ compact = false, records, title }) {
    return (<section className={compact ? "linked-records linked-records-compact" : "linked-records"} aria-label={title}>
      <header className="linked-records-header">
        <span className="file-card-label">{title}</span>
        <p>
          {records.length} {records.length === 1 ? "registro" : "registros"}
        </p>
      </header>

      <ul className="year-record-list">
        {records.map((record) => (<YearRecordCard key={record.id} record={record}/>))}
      </ul>
    </section>);
}

export function YearLibrary({ isSingleYear = false, yearGroups }) {
    return (<section className="year-library" aria-label={isSingleYear ? "Biblioteca do ano" : "Biblioteca por ano"}>
      {!isSingleYear ? (<div className="year-library-intro">
          <span className="file-card-label">Biblioteca por ano</span>
          <p>
            Registros agrupados por ano em ordem decrescente, calculados a
            partir dos JSONs carregados no build. Novos arquivos aparecem aqui
            depois de salvos no repositorio, commitados manualmente e incluidos
            em um novo build.
          </p>
        </div>) : null}

      {yearGroups.map((group) => (<YearGroup group={group} key={group.year}/>))}
    </section>);
}

function YearGroup({ group }) {
    const headingId = `library-year-${group.year}`;
    return (<section className="year-group" aria-labelledby={headingId}>
      <header className="year-group-header">
        <div>
          <span className="file-card-label">Ano</span>
          <h2 id={headingId}>{group.year}</h2>
        </div>
        <p>
          {group.count} {group.count === 1 ? "registro" : "registros"}
          {group.orphanWatchRecords > 0
            ? ` / ${group.orphanWatchRecords} ${group.orphanWatchRecords === 1 ? "orfao recuperavel" : "orfaos recuperaveis"}`
            : ""}
        </p>
      </header>

      <ul className="year-record-list">
        {group.records.map((record) => (<YearRecordCard key={record.id} record={record}/>))}
      </ul>
    </section>);
}

function YearRecordCard({ record }) {
    const isOrphan = record.relationshipStatus === "orphan";
    return (<li className={isOrphan ? "year-record year-record-orphan" : "year-record"}>
      <strong className="year-record-unit">{record.unitLabel}</strong>

      <div className="year-record-title">
        <strong>{record.title}</strong>
        <small>{record.id}</small>
      </div>

      <dl className="year-record-facts">
        <RecordFact label="Ano" value={record.year}/>
        <RecordFact label="Categoria" value={record.category ? formatMetricLabel(record.category) : "sem midia"}/>
        <RecordFact label="Status pessoal" value={formatMetricLabel(record.watchStatus)}/>
        {record.productionStatus ? (<RecordFact label="Producao" value={formatMetricLabel(record.productionStatus)}/>) : null}
        {record.platform ? <RecordFact label="Plataforma" value={record.platform}/> : null}
        {isOrphan ? <RecordFact label="Relacao" value="recuperavel"/> : null}
      </dl>

      {isOrphan ? (<p className="year-record-recovery">
          Adicione um Media Item com id <code>{record.mediaId}</code> em{" "}
          <code>data/media</code> e faca o commit manual para ligar este Watch
          Record no proximo build. O JSON original do registro nao precisa
          mudar.
        </p>) : null}
    </li>);
}

export function RecordFact({ label, value }) {
    return (<div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>);
}
