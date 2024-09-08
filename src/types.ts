export type Predicate<T> = (item: T) => boolean;

export type LinkGroup = { id: number; links: Link[] };

export type Link = { id: number; uri: string; title: string; tags: string[] };

export type SortData = {
    column: keyof Link;
    order: "asc" | "desc";
};

export type ResolveDupeItemRow = {
    group_id: number;
    link_id: number;
    groups: LinkGroup;
};

export type ResolveDupeItem = {
    dupes_left: number;
    key: string;
    groups: LinkGroup[];
};
