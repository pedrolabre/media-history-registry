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

export function OrphanWatchRecordDiagnostics({ records, scopeLabel = "snapshot carregado" }) {
    const orphanRecords = (Array.isArray(records) ? records : []).filter(
        (record) => record.relationshipStatus === "orphan"
    );

    if (orphanRecords.length === 0) {
        return null;
    }

    const headingId = `orphan-diagnostics-${slugifyForId(scopeLabel)}`;
    return (<section className="orphan-diagnostics" aria-labelledby={headingId}>
      <header className="orphan-diagnostics-header">
        <div>
          <span className="file-card-label">Diagnostico</span>
          <h2 id={headingId}>Watch Records orfaos</h2>
          <p>
            Estes registros existem no {scopeLabel}, mas apontam para um{" "}
            <code>media_id</code> sem Media Item correspondente. A validacao
            local ou CI pode falhar nessa relacao invalida; a UI apenas ajuda a
            investigar o snapshot carregado.
          </p>
        </div>
        <strong>
          {orphanRecords.length} {orphanRecords.length === 1 ? "orfao" : "orfaos"}
        </strong>
      </header>

      <ul className="orphan-record-list orphan-diagnostics-list">
        {orphanRecords.map((record) => (<OrphanDiagnosticCard key={`${record.origin?.path || record.id}-diagnostic`} record={record}/>))}
      </ul>
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
          Registro orfao: confira o diagnostico do recorte para ver path de
          origem, <code>media_id</code>, ano e unidade. Acao esperada:
          adicionar ou corrigir o Media Item correspondente e fazer o commit
          manual.
        </p>) : null}
    </li>);
}

export function RecordFact({ label, value }) {
    return (<div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>);
}

function OrphanDiagnosticCard({ record }) {
    const diagnostic = record.orphanDiagnostic || buildFallbackDiagnostic(record);
    return (<li className="orphan-diagnostic-card">
      <div className="orphan-diagnostic-copy">
        <strong>Media Item ausente</strong>
        <span>
          O Watch Record referencia <code>{diagnostic.missingMediaId}</code>,
          mas esse id nao foi encontrado em <code>data/media</code>.
        </span>
      </div>

      <dl className="source-ledger orphan-diagnostic-grid">
        <RecordFact label="ID do registro" value={diagnostic.recordId}/>
        <RecordFact label="media_id" value={diagnostic.missingMediaId}/>
        <RecordFact label="Path de origem" value={diagnostic.sourcePath}/>
        <RecordFact label="Ano do registro" value={diagnostic.recordYear}/>
        <RecordFact label="Ano do path" value={diagnostic.sourceYear}/>
        <RecordFact label="Unidade derivada" value={diagnostic.unitLabel}/>
        <RecordFact label="Unidade bruta" value={diagnostic.rawUnit}/>
      </dl>

      <p className="orphan-diagnostic-action">
        <strong>Acao esperada</strong>
        {diagnostic.expectedAction} A aplicacao nao altera JSONs nem grava em{" "}
        <code>data/</code>; corrija manualmente, rode a validacao local e faca
        o commit quando o relacionamento estiver valido.
      </p>
    </li>);
}

function buildFallbackDiagnostic(record) {
    return {
        recordId: record.id || "id nao informado",
        missingMediaId: record.mediaId || "media_id ausente",
        sourcePath: record.origin?.path || "path nao informado",
        sourceYear: record.origin?.year || "ano do path nao informado",
        recordYear: record.year || "ano nao informado",
        unitLabel: record.unitLabel || "UN",
        rawUnit: describeRawUnit(record.unit),
        expectedAction:
            `Adicionar um Media Item com id "${record.mediaId || "media_id ausente"}" em data/media ou corrigir o media_id deste Watch Record.`
    };
}

function describeRawUnit(unit) {
    if (!unit || typeof unit !== "object" || Array.isArray(unit)) {
        return "unidade nao informada";
    }

    const parts = Object.entries(unit)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => `${key}: ${String(value)}`);

    return parts.length > 0 ? parts.join(", ") : "unidade vazia";
}

function slugifyForId(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "snapshot";
}
