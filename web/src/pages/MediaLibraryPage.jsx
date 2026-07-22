import { MediaDetail } from "../components/library/MediaSections";
import { LoaderErrorState, MediaNotFoundState } from "../components/library/LibraryStates";
import { LibrarySummary } from "../components/library/LibrarySummary";
import { useLibraryExplorer } from "../components/library/useLibraryExplorer";

export function MediaLibraryPage({ data, mediaId }) {
    const mediaItem = findMediaItem(data.normalized.mediaItems, mediaId);
    const explorer = useLibraryExplorer(mediaItem?.watchRecords || []);
    return (<div className="library-loader">
      <LibrarySummary data={data}/>

      {data.status === "error" ? <LoaderErrorState data={data}/> : null}

      {mediaItem ? <MediaDetail explorer={explorer} mediaItem={mediaItem}/> : <MediaNotFoundState mediaId={mediaId}/>}
    </div>);
}

function findMediaItem(mediaItems, mediaId) {
    return mediaItems.find((mediaItem) => mediaItem.id === mediaId) || null;
}
