function App() {
    return (<main className="app-shell" aria-labelledby="app-title">
      <section className="intro-panel">
        <p className="eyebrow">Scaffold web</p>
        <h1 id="app-title">Media History Registry</h1>
        <p className="tagline">Your media history belongs to you. Store it as structured data.</p>
      </section>

      <section className="notice-panel" aria-labelledby="data-control-title">
        <h2 id="data-control-title">Controle manual preservado</h2>
        <p>
          Esta base web nao salva arquivos no repositorio e nao escreve no GitHub.
          Os JSONs gerados nos proximos blocos serao copiados ou baixados para commit manual.
        </p>
      </section>
    </main>);
}
export default App;
