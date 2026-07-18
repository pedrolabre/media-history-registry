import { useEffect, useMemo, useState } from "react";
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
            content: <LibraryWorkspace />
        };
    }
    if (pathname === "/generate/media") {
        return {
            eyebrow: "Media Item",
            title: "Nova midia",
            description: "Defina a obra uma vez para que varios eventos de consumo possam referencia-la depois.",
            content: (<GeneratorWorkspace entity="Media Item" path="data/media/{category}/{slug}.json" fields={["title", "category", "format", "status"]}/>)
        };
    }
    if (pathname === "/generate/watch-record") {
        return {
            eyebrow: "Watch Record",
            title: "Novo registro",
            description: "Registre o consumo de uma temporada, filme, especial, arco ou obra completa.",
            content: (<GeneratorWorkspace entity="Watch Record" path="data/history/{year}/{slug}.json" fields={["media_id", "year", "unit", "watch_status"]}/>)
        };
    }
    const yearMatch = /^\/library\/year\/([^/]+)$/.exec(pathname);
    if (yearMatch) {
        return {
            eyebrow: "Ano",
            title: "Recorte por ano",
            description: "Uma gaveta pronta para agrupar tudo que foi assistido em um ano.",
            content: <RouteWorkspace label="Ano" path="data/history/{year}" value={yearMatch[1]}/>
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
function LibraryWorkspace() {
    return (<div className="registry-flow">
      <article className="record-lane record-lane-media">
        <span className="lane-number">01</span>
        <h2>Media Item</h2>
        <p>O que existe: obra, categoria, formato, status e metadados estaveis.</p>
      </article>
      <article className="record-lane record-lane-watch">
        <span className="lane-number">02</span>
        <h2>Watch Record</h2>
        <p>O que voce consumiu: ano, unidade assistida, status pessoal e plataforma.</p>
      </article>
      <article className="record-lane record-lane-view">
        <span className="lane-number">03</span>
        <h2>Library View</h2>
        <p>O que a interface deriva: ano, midia, categoria, filtros e rotulos visuais.</p>
      </article>
    </div>);
}
function GeneratorWorkspace({ entity, fields, path }) {
    return (<div className="generator-board">
      <div className="file-card">
        <span className="file-card-label">Entidade</span>
        <strong>{entity}</strong>
      </div>
      <div className="file-card file-card-wide">
        <span className="file-card-label">Destino</span>
        <code className="path-chip">{path}</code>
      </div>
      <div className="field-rack">
        {fields.map((field) => (<span key={field}>{field}</span>))}
      </div>
      <p className="manual-note">
        O formulario real entra nos proximos blocos. Esta tela fixa a estrutura visual e
        reforca que salvar e commitar continuam manuais.
      </p>
    </div>);
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
