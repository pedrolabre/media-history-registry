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
function LibraryWorkspace({ data }) {
    const isEmpty = data.counts.mediaItems === 0 && data.counts.watchRecords === 0;
    return (<div className="library-loader">
      <div className="library-metrics" aria-label="Dados carregados">
        <MetricCard detail="data/media" label="Media Items" value={data.counts.mediaItems}/>
        <MetricCard detail="data/history" label="Watch Records" value={data.counts.watchRecords}/>
        <MetricCard detail="pastas detectadas" label="Categorias" value={data.counts.categories}/>
        <MetricCard detail="anos detectados" label="Anos" value={data.counts.years}/>
      </div>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {data.status !== "error" && isEmpty ? <LoaderEmptyState /> : null}

      {data.status !== "error" && !isEmpty ? <LoaderReadyState data={data}/> : null}
    </div>);
}
function MetricCard({ detail, label, value }) {
    return (<article className="library-metric">
      <span className="file-card-label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>);
}
function LoaderReadyState({ data }) {
    return (<article className="loader-state loader-state-ready" role="status">
      <div>
        <span className="file-card-label">Loader</span>
        <h2>Snapshot carregado</h2>
        <p>
          Os dados abaixo foram descobertos no build e existem apenas como visao
          derivada da aplicacao.
        </p>
      </div>
      <dl className="source-ledger">
        <div>
          <dt>Categorias</dt>
          <dd>{formatList(data.categories)}</dd>
        </div>
        <div>
          <dt>Anos</dt>
          <dd>{formatList(data.years)}</dd>
        </div>
        <div>
          <dt>Primeiro Media Item</dt>
          <dd>{formatPath(data.mediaItems[0]?.origin.path)}</dd>
        </div>
        <div>
          <dt>Primeiro Watch Record</dt>
          <dd>{formatPath(data.watchRecords[0]?.origin.path)}</dd>
        </div>
      </dl>
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
function LoaderEmptyState() {
    return (<article className="loader-state loader-state-empty" role="status">
      <div>
        <span className="file-card-label">Loader</span>
        <h2>Nenhum JSON carregado</h2>
        <p>
          O snapshot atual nao encontrou arquivos em <code>data/media</code> ou{" "}
          <code>data/history</code>.
        </p>
      </div>
    </article>);
}
function formatList(values) {
    return values.length > 0 ? values.join(", ") : "nenhum";
}
function formatPath(value) {
    return value || "nenhum arquivo";
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
