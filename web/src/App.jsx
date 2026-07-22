import { useEffect, useMemo, useRef, useState } from "react";
import { isActive, navItems, resolveRoute, routeExamples } from "./routes";

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

export default App;
