import { CategoryDetail } from "../components/library/MediaSections";
import { CategoryNoMediaState, LoaderErrorState } from "../components/library/LibraryStates";
import { LibrarySummary } from "../components/library/LibrarySummary";
import { useLibraryExplorer } from "../components/library/useLibraryExplorer";

export function CategoryLibraryPage({ category, data }) {
    const categoryGroup = findCategoryGroup(data.normalized.categoryGroups, category);
    const explorer = useLibraryExplorer(categoryGroup?.watchRecords || []);
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {categoryGroup ? (<CategoryDetail categoryGroup={categoryGroup} explorer={explorer}/>) : (<CategoryNoMediaState category={category}/>)}
    </div>);
}

function findCategoryGroup(categoryGroups, category) {
    return categoryGroups.find((group) => group.category === category) || null;
}
