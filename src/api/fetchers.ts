import { cache } from "@solidjs/router";
import { invoke } from "@tauri-apps/api";
import { Link, LinkGroup, ResolveDupeItem } from "@/types";

export const CacheKeys = {
    LINK_GROUPS: "link_groups",
    LINKS: "links",
    TAGS: "tags",
    DUPES: "dupes",
} as const;

export const ALL_CACHE_KEYS = Object.values(CacheKeys);

export const getLinkGroups = cache(
    () => invoke("get_links") as Promise<LinkGroup[]>,
    CacheKeys.LINK_GROUPS,
);

export const getTags = cache(
    () => invoke("get_tags") as Promise<string[]>,
    CacheKeys.TAGS,
);

export const getTagsForLink = cache(
    (id: number) => invoke("get_tags_for_link", { id }) as Promise<string[]>,
    CacheKeys.TAGS,
);

export const getDupes = cache(
    () => invoke("resolve_dupes") as Promise<ResolveDupeItem>,
    CacheKeys.DUPES,
);

export const searchLinks = cache(
    ({
        searchText,
        sortBy,
        sortDirection,
        tag,
    }: {
        searchText: string | undefined;
        sortBy: string | undefined;
        sortDirection: "asc" | "desc" | undefined;
        tag: string | undefined;
    }) => {
        return invoke("search", {
            searchText,
            sortBy: sortBy ?? "name",
            sortDirection: sortDirection ?? "asc",
            tag,
        }) as Promise<Link[]>;
    },
    CacheKeys.LINKS,
);

export const searchTags = cache(
    (
        searchText: string | undefined,
        sortDirection: "asc" | "desc" | undefined,
    ) => {
        return invoke("get_tags", {
            searchText,
            sortDirection: sortDirection ?? "asc",
        }) as Promise<string[]>;
    },
    CacheKeys.TAGS,
);
