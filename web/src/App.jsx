import { useEffect, useMemo, useRef, useState } from "react";
import { MediaItemGenerator } from "./components/MediaItemGenerator";
import { WatchRecordGenerator } from "./components/WatchRecordGenerator";
import {
    DEFAULT_LIBRARY_SORT,
    LIBRARY_SORT_DIRECTIONS,
    LIBRARY_SORT_FIELDS,
    applyLibraryFiltersAndSorting,
    buildYearGroups,
    createEmptyLibraryFilters,
    getDefaultLibrarySortDirection,
    groupRecordsByMediaId,
    staticLibraryData
} from "./data-loader";
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
const libraryFilterControls = [
    { key: "category", label: "Categoria", optionsKey: "categories", emptyLabel: "Todas" },
    { key: "subcategory", label: "Subcategoria", optionsKey: "subcategories", emptyLabel: "Todas" },
    { key: "genre", label: "Genero", optionsKey: "genres", emptyLabel: "Todos" },
    { key: "watchStatus", label: "Status pessoal", optionsKey: "watchStatuses", emptyLabel: "Todos" },
    { key: "productionStatus", label: "Status producao", optionsKey: "productionStatuses", emptyLabel: "Todos" },
    { key: "platform", label: "Plataforma", optionsKey: "platforms", emptyLabel: "Todas" },
    { key: "year", label: "Ano", optionsKey: "years", emptyLabel: "Todos" }
];
function App() {
    const [pathname, setPathname] = useState(() => window.location.pathname);
    const route = useMemo(() => resolveRoute(pathname), [pathname]);
    const workspaceRef = useRef(null);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        const handlePopState = () => setPathname(window.location.pathname);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        workspaceRef.current?.focus({ preventScroll: true });
    }, [pathname]);

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
      <p className="sr-only" aria-live="polite">
        Rota atual: {route.title}
      </p>

      <main aria-describedby="page-description" className="registry-board" id="workspace" ref={workspaceRef} tabIndex={-1}>
        <header className="ledger-cover" aria-labelledby="page-title">
          <div className="identity-panel">
            <p className="stamp">Media History Registry</p>
            <h1 id="page-title">{route.title}</h1>
            <p className="lede" id="page-description">{route.description}</p>
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
        </header>

        <section className="workbench-grid" aria-labelledby="workspace-heading">
          <aside className="drawer-panel" aria-labelledby="drawer-title">
            <p className="panel-label">Mapa</p>
            <h2 id="drawer-title">Gavetas iniciais</h2>
            <div className="drawer-list">
              {routeExamples.map((item) => (<a aria-current={pathname === item.href ? "page" : undefined} className="drawer-row" data-app-link href={item.href} key={item.href}>
                  <span>{item.label}</span>
                  <code>{item.value}</code>
                </a>))}
            </div>
          </aside>

          <section className="workspace-panel" aria-labelledby="workspace-heading">
            <h2 className="sr-only" id="workspace-heading">{route.eyebrow}</h2>
            <p aria-hidden="true" className="panel-label">{route.eyebrow}</p>
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
        const year = decodeRouteValue(yearMatch[1]);
        return {
            eyebrow: "Ano",
            title: `Ano ${year}`,
            description: "Um recorte da biblioteca com somente os registros encontrados para este ano.",
            content: <YearLibraryWorkspace data={staticLibraryData} year={year}/>
        };
    }
    const mediaMatch = /^\/library\/media\/([^/]+)$/.exec(pathname);
    if (mediaMatch) {
        const mediaId = decodeRouteValue(mediaMatch[1]);
        return {
            eyebrow: "Midia",
            title: "Historico da obra",
            description: "Uma gaveta para reunir a obra selecionada e todos os registros ligados a ela.",
            content: <MediaLibraryWorkspace data={staticLibraryData} mediaId={mediaId}/>
        };
    }
    const categoryMatch = /^\/library\/category\/([^/]+)$/.exec(pathname);
    if (categoryMatch) {
        const category = decodeRouteValue(categoryMatch[1]);
        return {
            eyebrow: "Categoria",
            title: "Categoria",
            description: "Uma gaveta para navegar as obras de uma categoria e seus registros ligados.",
            content: <CategoryLibraryWorkspace category={category} data={staticLibraryData}/>
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
function useLibraryExplorer(records) {
    const [filters, setFilters] = useState(() => createEmptyLibraryFilters());
    const [sort, setSort] = useState(() => ({ ...DEFAULT_LIBRARY_SORT }));
    const result = useMemo(() => applyLibraryFiltersAndSorting(records, filters, sort), [records, filters, sort]);

    function updateFilter(key, value) {
        setFilters((currentFilters) => ({
            ...currentFilters,
            [key]: value
        }));
    }

    function updateSortField(field) {
        setSort({
            field,
            direction: getDefaultLibrarySortDirection(field)
        });
    }

    function updateSortDirection(direction) {
        setSort((currentSort) => ({
            ...currentSort,
            direction
        }));
    }

    function clearFilters() {
        setFilters(createEmptyLibraryFilters());
    }

    return {
        ...result,
        updateFilter,
        updateSortField,
        updateSortDirection,
        clearFilters
    };
}
function LibraryWorkspace({ data }) {
    const explorer = useLibraryExplorer(data.normalized.watchRecords);
    const yearGroups = buildYearGroups(explorer.records, {
        preserveRecordOrder: true,
        yearDirection: explorer.sort.field === "year" ? explorer.sort.direction : "desc"
    });
    const isEmpty = data.normalized.watchRecords.length === 0;
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {isEmpty ? <LibraryEmptyState /> : null}

      {!isEmpty ? <LibraryControls explorer={explorer}/> : null}

      {!isEmpty && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {!isEmpty && explorer.filteredCount > 0 ? <YearLibrary yearGroups={yearGroups}/> : null}
    </div>);
}
function YearLibraryWorkspace({ data, year }) {
    const yearGroup = findYearGroup(data.normalized.yearGroups, year);
    const explorer = useLibraryExplorer(yearGroup?.records || []);
    const yearGroups = buildYearGroups(explorer.records, {
        preserveRecordOrder: true,
        yearDirection: explorer.sort.field === "year" ? explorer.sort.direction : "desc"
    });
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {yearGroup ? <LibraryControls explorer={explorer}/> : null}

      {yearGroup && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {yearGroup && explorer.filteredCount > 0 ? (<YearLibrary isSingleYear yearGroups={yearGroups}/>) : null}

      {!yearGroup ? (<YearEmptyState hasLibraryRecords={data.normalized.watchRecords.length > 0} year={year}/>) : null}
    </div>);
}
function MediaLibraryWorkspace({ data, mediaId }) {
    const mediaItem = findMediaItem(data.normalized.mediaItems, mediaId);
    const explorer = useLibraryExplorer(mediaItem?.watchRecords || []);
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {mediaItem ? <MediaDetail explorer={explorer} mediaItem={mediaItem}/> : <MediaNotFoundState mediaId={mediaId}/>}
    </div>);
}
function CategoryLibraryWorkspace({ category, data }) {
    const categoryGroup = findCategoryGroup(data.normalized.categoryGroups, category);
    const explorer = useLibraryExplorer(categoryGroup?.watchRecords || []);
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {categoryGroup ? (<CategoryDetail categoryGroup={categoryGroup} explorer={explorer}/>) : (<CategoryNoMediaState category={category}/>)}
    </div>);
}
function MediaDetail({ explorer, mediaItem }) {
    const hasRecords = mediaItem.watchRecords.length > 0;
    return (<section className="media-library" aria-labelledby={`media-${mediaItem.id}`}>
      <MediaProfile mediaItem={mediaItem}/>

      {hasRecords ? <LibraryControls explorer={explorer}/> : null}

      {hasRecords && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {hasRecords && explorer.filteredCount > 0 ? (<LinkedRecordCollection records={explorer.records} title="Watch Records ligados"/>) : null}

      {!hasRecords ? <MediaNoRecordsState mediaItem={mediaItem}/> : null}
    </section>);
}
function CategoryDetail({ categoryGroup, explorer }) {
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
function LinkedRecordCollection({ compact = false, records, title }) {
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
function MediaNotFoundState({ mediaId }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Midia inexistente</span>
        <h2>Nenhuma obra encontrada</h2>
        <p>
          Nao existe Media Item com id <code>{mediaId}</code> no snapshot atual
          de <code>data/media</code>.
        </p>
      </div>
      <a className="inline-action" data-app-link href="/library">
        Ver biblioteca completa
      </a>
    </article>);
}
function MediaNoRecordsState({ compact = false, mediaItem }) {
    if (compact) {
        return (<p className="compact-empty-state" role="status">
          <strong>Sem Watch Records ligados.</strong> Nenhum registro referencia{" "}
          <code>{mediaItem.id}</code> neste snapshot.
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
      </div>
    </article>);
}
function CategoryNoMediaState({ category }) {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Categoria sem midias</span>
        <h2>Nenhuma midia em {formatMetricLabel(category)}</h2>
        <p>
          O snapshot atual nao encontrou Media Items em{" "}
          <code>data/media/{category}</code>.
        </p>
      </div>
      <a className="inline-action" data-app-link href="/library">
        Ver biblioteca completa
      </a>
    </article>);
}
function CategoryNoRecordsState({ categoryGroup }) {
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
      </div>
    </article>);
}
function MetricCard({ detail, label, value }) {
    return (<article className="library-metric" aria-label={`${label}: ${value}`}>
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
function LibraryControls({ explorer }) {
    return (<section className="library-controls" aria-labelledby="library-controls-title">
      <header className="library-controls-header">
        <div>
          <span className="file-card-label">Filtros</span>
          <h2 id="library-controls-title">Recorte da biblioteca</h2>
        </div>
        <strong>
          {explorer.filteredCount} de {explorer.totalCount}
        </strong>
      </header>

      <div className="library-filter-grid">
        {libraryFilterControls.map((control) => (<FilterSelect control={control} explorer={explorer} key={control.key}/>))}

        <label className="library-control-field">
          <span>Ordenar por</span>
          <select value={explorer.sort.field} onChange={(event) => explorer.updateSortField(event.target.value)}>
            {LIBRARY_SORT_FIELDS.map((option) => (<option key={option.value} value={option.value}>
                {option.label}
              </option>))}
          </select>
        </label>

        <label className="library-control-field">
          <span>Direcao</span>
          <select value={explorer.sort.direction} onChange={(event) => explorer.updateSortDirection(event.target.value)}>
            {LIBRARY_SORT_DIRECTIONS.map((option) => (<option key={option.value} value={option.value}>
                {option.label}
              </option>))}
          </select>
        </label>

        <button className="library-clear-button" disabled={!explorer.hasActiveFilters} onClick={explorer.clearFilters} type="button">
          Limpar filtros
        </button>
      </div>
    </section>);
}
function FilterSelect({ control, explorer }) {
    const options = explorer.filterOptions[control.optionsKey] || [];
    return (<label className="library-control-field">
      <span>{control.label}</span>
      <select value={explorer.filters[control.key]} onChange={(event) => explorer.updateFilter(control.key, event.target.value)}>
        <option value="">{control.emptyLabel}</option>
        {options.map((option) => (<option key={option.value} value={option.value}>
            {formatOptionLabel(option.value)} ({option.count})
          </option>))}
      </select>
    </label>);
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
function findMediaItem(mediaItems, mediaId) {
    return mediaItems.find((mediaItem) => mediaItem.id === mediaId) || null;
}
function findCategoryGroup(categoryGroups, category) {
    return categoryGroups.find((group) => group.category === category) || null;
}
function decodeRouteValue(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
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
function FilterNoResultsState({ explorer }) {
    const hiddenRecordsText =
        explorer.totalCount === 1
            ? "o registro disponivel."
            : `todos os ${explorer.totalCount} registros disponiveis.`;
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Sem resultados</span>
        <h2>Nenhum Watch Record neste recorte</h2>
        <p>Os filtros ativos ocultaram {hiddenRecordsText}</p>
      </div>
    </article>);
}
function formatOptionLabel(value) {
    return formatMetricLabel(value);
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
