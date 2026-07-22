import { LIBRARY_SORT_DIRECTIONS, LIBRARY_SORT_FIELDS } from "../../data-loader";
import { formatOptionLabel } from "./formatting";

const libraryFilterControls = [
    { key: "category", label: "Categoria", optionsKey: "categories", emptyLabel: "Todas" },
    { key: "subcategory", label: "Subcategoria", optionsKey: "subcategories", emptyLabel: "Todas" },
    { key: "genre", label: "Genero", optionsKey: "genres", emptyLabel: "Todos" },
    { key: "watchStatus", label: "Status pessoal", optionsKey: "watchStatuses", emptyLabel: "Todos" },
    { key: "productionStatus", label: "Status producao", optionsKey: "productionStatuses", emptyLabel: "Todos" },
    { key: "platform", label: "Plataforma", optionsKey: "platforms", emptyLabel: "Todas" },
    { key: "year", label: "Ano", optionsKey: "years", emptyLabel: "Todos" }
];

export function LibraryControls({ explorer }) {
    return (<section className="library-controls" aria-labelledby="library-controls-title">
      <header className="library-controls-header">
        <div>
          <span className="file-card-label">Filtros</span>
          <h2 id="library-controls-title">Recorte da biblioteca</h2>
          <p>
            Filtros e ordenacao mudam apenas esta visualizacao; nenhuma
            preferencia e salva no repositorio.
          </p>
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
