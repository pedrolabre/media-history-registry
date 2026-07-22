import { buildYearGroups } from "../data-loader";
import { LibraryControls } from "../components/library/LibraryControls";
import { LibraryEmptyState, FilterNoResultsState, LoaderErrorState } from "../components/library/LibraryStates";
import { LibrarySummary } from "../components/library/LibrarySummary";
import { OrphanWatchRecordDiagnostics, YearLibrary } from "../components/library/RecordList";
import { useLibraryExplorer } from "../components/library/useLibraryExplorer";

export function LibraryPage({ data }) {
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

      <OrphanWatchRecordDiagnostics records={data.normalized.orphanWatchRecords}/>

      {!isEmpty ? <LibraryControls explorer={explorer}/> : null}

      {!isEmpty && explorer.filteredCount === 0 ? <FilterNoResultsState explorer={explorer}/> : null}

      {!isEmpty && explorer.filteredCount > 0 ? <YearLibrary yearGroups={yearGroups}/> : null}
    </div>);
}
