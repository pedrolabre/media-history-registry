import { useEffect, useMemo, useState } from "react";
import { MediaItemGenerator } from "./components/MediaItemGenerator";
import { WatchRecordGenerator } from "./components/WatchRecordGenerator";
import { staticLibraryData } from "./data-loader";
const navItems = [
    { href: "/", label: "Biblioteca", note: "views" },
    { href: "/generate/media", label: "Midia", note: "media item" },
    { href: "/generate/watch-record", label: "Registro", note: "watch record" }
];
const routeExamples = [
    { href: "/library/year/2026", label: "Ano", value: "2026" },
    { href: "/library/media/spy-family", label: "Midia", value: "spy-family" },
    { href: "/library/category/anime", label: "Categoria", value: "anime" }
];
function App() {
    const [pathname, setPathname] = useState(() => window.location.pathname);
    const route = useMemo(() => resolveRoute(pathname), [pathname]);
    useEffect(() => {
        const handlePopState = () => setPathname(window.location.pathname);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);
    function handleNavigation(event) {
        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey) {
            return;
        }
        if (!(event.target instanceof Element)) {
            return;
        }
        const anchor = event.target.closest("a[data-app-link]");
        if (!anchor || anchor.target) {
            return;
        }
        const nextUrl = new URL(anchor.href);
        if (nextUrl.origin !== window.location.origin) {
            return;
        }
        event.preventDefault();
        if (nextUrl.pathname !== window.location.pathname) {
            window.history.pushState({}, "", nextUrl.pathname);
            setPathname(nextUrl.pathname);
            window.scrollTo({ top: 0 });
        }
    }
    return (<div className="app-shell" onClick={handleNavigation}>
      <a className="skip-link" href="#workspace">
        Pular para o workspace
      </a>

      <main className="registry-board" id="workspace">
        <section className="ledger-cover" aria-labelledby="page-title">
          <div className="identity-panel">
            <p className="stamp">Media History Registry</p>
            <h1 id="page-title">{route.title}</h1>
            <p className="lede">{route.description}</p>
          </div>

          <nav className="file-tabs" aria-label="Navegacao principal">
            {navItems.map((item) => (<a aria-current={isActive(pathname, item.href) ? "page" : undefined} className={isActive(pathname, item.href) ? "file-tab is-active" : "file-tab"} data-app-link href={item.href} key={item.href}>
                <span>{item.label}</span>
                <small>{item.note}</small>
              </a>))}
          </nav>

          <dl className="control-stamps" aria-label="Politica da aplicacao">
            <div>
              <dt>Fonte</dt>
              <dd>JSON</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>Estatico</dd>
            </div>
            <div>
              <dt>Git</dt>
              <dd>Manual</dd>
            </div>
          </dl>
        </section>

        <section className="workbench-grid" aria-label={route.eyebrow}>
          <aside className="drawer-panel" aria-labelledby="drawer-title">
            <p className="panel-label">Mapa</p>
            <h2 id="drawer-title">Gavetas iniciais</h2>
            <div className="drawer-list">
              {routeExamples.map((item) => (<a className="drawer-row" data-app-link href={item.href} key={item.href}>
                  <span>{item.label}</span>
                  <code>{item.value}</code>
                </a>))}
            </div>
          </aside>

          <section className="workspace-panel">
            <p className="panel-label">{route.eyebrow}</p>
            {route.content}
          </section>
        </section>
      </main>
    </div>);
}
function resolveRoute(pathname) {
    if (pathname === "/" || pathname === "/library") {
        return {
            eyebrow: "Biblioteca",
            title: "Historico audiovisual",
            description: "Uma bancada para transformar obras assistidas em registros claros, portateis e versionados.",
            content: <LibraryWorkspace data={staticLibraryData}/>
        };
    }
    if (pathname === "/generate/media") {
        return {
            eyebrow: "Media Item",
            title: "Nova midia",
            description: "Defina a obra uma vez para que varios eventos de consumo possam referencia-la depois.",
            content: <MediaItemGenerator />
        };
    }
    if (pathname === "/generate/watch-record") {
        return {
            eyebrow: "Watch Record",
            title: "Novo registro",
            description: "Registre o consumo de uma temporada, filme, especial, arco ou obra completa.",
            content: <WatchRecordGenerator />
        };
    }
    const yearMatch = /^\/library\/year\/([^/]+)$/.exec(pathname);
    if (yearMatch) {
        const year = decodeURIComponent(yearMatch[1]);
        return {
            eyebrow: "Ano",
            title: `Ano ${year}`,
            description: "Um recorte da biblioteca com somente os registros encontrados para este ano.",
            content: <YearLibraryWorkspace data={staticLibraryData} year={year}/>
        };
    }
    const mediaMatch = /^\/library\/media\/([^/]+)$/.exec(pathname);
    if (mediaMatch) {
        return {
            eyebrow: "Midia",
            title: "Historico da obra",
            description: "Uma gaveta pronta para reunir todos os registros ligados a uma obra.",
            content: <RouteWorkspace label="Media ID" path="data/media/{category}" value={mediaMatch[1]}/>
        };
    }
    const categoryMatch = /^\/library\/category\/([^/]+)$/.exec(pathname);
    if (categoryMatch) {
        return {
            eyebrow: "Categoria",
            title: "Categoria",
            description: "Uma gaveta pronta para navegar obras por familia audiovisual.",
            content: (<RouteWorkspace label="Categoria" path="data/media/{category}" value={categoryMatch[1]}/>)
        };
    }
    return {
        eyebrow: "404",
        title: "Pagina indisponivel",
        description: "Essa rota ainda nao existe no mapa inicial da aplicacao.",
        content: <RouteWorkspace label="Rota" path="/" value="nao registrada"/>
    };
}
function isActive(pathname, href) {
    if (href === "/") {
        return pathname === "/" || pathname.startsWith("/library");
    }
    return pathname === href;
}
function LibraryWorkspace({ data }) {
    const yearGroups = data.normalized.yearGroups;
    const isEmpty = yearGroups.length === 0;
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {isEmpty ? <LibraryEmptyState /> : null}

      {!isEmpty ? <YearLibrary yearGroups={yearGroups}/> : null}
    </div>);
}
function YearLibraryWorkspace({ data, year }) {
    const yearGroup = findYearGroup(data.normalized.yearGroups, year);
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {yearGroup ? (<YearLibrary isSingleYear yearGroups={[yearGroup]}/>) : (<YearEmptyState hasLibraryRecords={data.normalized.watchRecords.length > 0} year={year}/>)}
    </div>);
}
function MetricCard({ detail, label, value }) {
    return (<article className="library-metric">
      <span className="file-card-label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>);
}
function LibrarySummary({ data }) {
    const relationships = data.normalized.relationships;
    return (<div className="library-metrics" aria-label="Resumo da biblioteca">
      <MetricCard detail="data/media" label="Media Items" value={data.counts.mediaItems}/>
      <MetricCard detail="data/history" label="Watch Records" value={data.counts.watchRecords}/>
      <MetricCard detail="anos carregados" label="Anos" value={data.normalized.yearGroups.length}/>
      <MetricCard detail="media_id ausente" label="Orfaos" value={relationships.orphanWatchRecords}/>
    </div>);
}
function YearLibrary({ isSingleYear = false, yearGroups }) {
    return (<section className="year-library" aria-label={isSingleYear ? "Biblioteca do ano" : "Biblioteca por ano"}>
      {!isSingleYear ? (<div className="year-library-intro">
          <span className="file-card-label">Biblioteca por ano</span>
          <p>
            Registros agrupados por ano em ordem decrescente, calculados a
            partir dos JSONs carregados no build.
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
          Adicione um Media Item com id <code>{record.mediaId}</code> para
          ligar este Watch Record sem alterar o JSON original.
        </p>) : null}
    </li>);
}
function RecordFact({ label, value }) {
    return (<div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>);
}
function findYearGroup(yearGroups, year) {
    return yearGroups.find((group) => String(group.year) === String(year)) || null;
}
function YearEmptyState({ hasLibraryRecords, year }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Ano vazio</span>
        <h2>Nenhum registro em {year}</h2>
        <p>
          {hasLibraryRecords
            ? "A biblioteca possui registros em outros anos, mas nenhum Watch Record foi encontrado para este recorte."
            : "O snapshot atual ainda nao encontrou Watch Records em data/history."}
        </p>
      </div>
      <a className="inline-action" data-app-link href="/library">
        Ver biblioteca completa
      </a>
    </article>);
}
function LoaderErrorState({ data }) {
    return (<article className="loader-state loader-state-error" role="alert">
      <div>
        <span className="file-card-label">Loader</span>
        <h2>Carregamento parcial</h2>
        <p>
          O app encontrou dados, mas alguns paths precisam de revisao. Os
          arquivos JSON continuam intactos no repositorio.
        </p>
      </div>
      <ul className="loader-error-list">
        {data.errors.map((error) => (<li key={`${error.path}-${error.message}`}>
            <code>{error.path}</code>
            <span>{error.message}</span>
          </li>))}
      </ul>
    </article>);
}
function LibraryEmptyState() {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Biblioteca vazia</span>
        <h2>Nenhum registro carregado</h2>
        <p>
          O snapshot atual ainda nao encontrou Watch Records em{" "}
          <code>data/history</code>. Media Items podem existir, mas a
          biblioteca por ano nasce dos registros de consumo.
        </p>
      </div>
    </article>);
}
function formatMetricLabel(value) {
    return String(value).replace(/[_-]/g, " ");
}
function RouteWorkspace({ label, path, value }) {
    return (<div className="route-board">
      <div className="file-card">
        <span className="file-card-label">{label}</span>
        <strong>{decodeURIComponent(value)}</strong>
      </div>
      <div className="file-card">
        <span className="file-card-label">Origem esperada</span>
        <code>{path}</code>
      </div>
      <div className="file-card">
        <span className="file-card-label">Status</span>
        <strong>Rota pronta</strong>
      </div>
    </div>);
}
export default App;
