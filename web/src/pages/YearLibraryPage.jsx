import { buildYearGroups } from "../data-loader";
import { LibraryControls } from "../components/library/LibraryControls";
import { FilterNoResultsState, LoaderErrorState, YearEmptyState } from "../components/library/LibraryStates";
import { LibrarySummary } from "../components/library/LibrarySummary";
import { YearLibrary } from "../components/library/RecordList";
import { useLibraryExplorer } from "../components/library/useLibraryExplorer";

export function YearLibraryPage({ data, year }) {
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

function findYearGroup(yearGroups, year) {
    return yearGroups.find((group) => String(group.year) === String(year)) || null;
}
