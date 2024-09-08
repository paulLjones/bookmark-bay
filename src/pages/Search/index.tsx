import {
    Params,
    RoutePreloadFuncArgs,
    createAsync,
    useSearchParams,
} from "@solidjs/router";
import { Match, Show, Switch } from "solid-js";
import { getTags, searchLinks } from "@/api/fetchers";
import LoadingIndicator from "@/components/LoadingIndicator";
import SearchBar from "@/components/SearchBar";
import { Link, SortData } from "@/types";
import SortTable from "./SortTable";

function searchLinksViaParams(params: Partial<Params>) {
    return searchLinks({
        searchText: params.searchText,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection as "asc" | "desc",
        tag: params.tag,
    });
}

export function SearchData({ params }: RoutePreloadFuncArgs) {
    searchLinksViaParams(params);
    getTags();
}

export default function Search() {
    const [params, setParams] = useSearchParams();

    const links = createAsync(() => searchLinksViaParams(params));
    const tags = createAsync(() => getTags());

    function setSearchText(searchText: string) {
        setParams({
            ...params,
            searchText,
        });
    }

    function setCurrentTag(tag: string | null) {
        setParams({
            ...params,
            tag,
        });
    }

    const sortData = () =>
        ({
            column: params.sortBy ?? "title",
            order: params.sortDirection ?? "asc",
        }) as SortData;

    function setSortData({
        column,
        order,
    }: {
        column: keyof Link;
        order: "asc" | "desc";
    }) {
        setParams({
            ...params,
            sortBy: column,
            sortDirection: order,
        });
    }

    return (
        <>
            <div class="sticky top-0 z-10">
                <SearchBar
                    searchText={params.searchText}
                    setSearchText={setSearchText}
                    tags={tags()}
                    currentTag={params.tag}
                    setCurrentTag={setCurrentTag}
                />
            </div>

            <div class="flex-grow overflow-hidden">
                <Show when={links()} fallback={<LoadingIndicator />}>
                    {(links) => (
                        <Switch
                            fallback={
                                <p class="p-3">No links are currently loaded</p>
                            }
                        >
                            <Match when={links().length}>
                                <SortTable
                                    data={links()}
                                    sortData={sortData()}
                                    setSortData={setSortData}
                                />
                            </Match>

                            <Match when={Boolean(params.searchText)}>
                                <p class="p-3">
                                    No links matching your search was found
                                </p>
                            </Match>
                        </Switch>
                    )}
                </Show>
            </div>
        </>
    );
}
