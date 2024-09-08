import {
    Params,
    RoutePreloadFuncArgs,
    createAsync,
    useSearchParams,
} from "@solidjs/router";
import { Show } from "solid-js";
import { searchTags } from "@/api/fetchers";
import createDialog from "@/components/Dialog";
import LoadingIndicator from "@/components/LoadingIndicator";
import SearchBar from "@/components/SearchBar";
import { SortData } from "@/types";
import TagList from "./TagList";

function searchTagsViaParams(params: Partial<Params>) {
    return searchTags(
        params.searchText,
        params.sortDirection as "asc" | "desc",
    );
}

export function TagsData({ params }: RoutePreloadFuncArgs) {
    searchTagsViaParams(params);
}

export default function Tags() {
    const [params, setParams] = useSearchParams();

    const tags = createAsync(() => searchTagsViaParams(params));

    const { showModal, Dialog } = createDialog();

    function setSearchText(key: string) {
        setParams({
            ...params,
            searchText: key,
        });
    }

    const sortData = () =>
        ({
            order: params.sortDirection ?? "asc",
        }) as SortData;

    function setSortData({ order }: { order: "asc" | "desc" }) {
        setParams({
            ...params,
            sortDirection: order,
        });
    }

    return (
        <>
            <div class="sticky top-0 z-10">
                <SearchBar
                    searchText={params.searchText}
                    setSearchText={setSearchText}
                    buttonLabel="Add Tag"
                    onButtonPress={showModal}
                />
            </div>

            <div class="flex-grow overflow-scroll">
                <Show when={tags()} fallback={<LoadingIndicator />}>
                    {(tags) => (
                        <TagList
                            data={tags()}
                            sortData={sortData()}
                            setSortData={setSortData}
                            Dialog={Dialog}
                            isFiltered={Boolean(params.searchText)}
                        />
                    )}
                </Show>
            </div>
        </>
    );
}
