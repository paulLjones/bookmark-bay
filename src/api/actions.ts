import { revalidate } from "@solidjs/router";
import { invoke } from "@tauri-apps/api";
import { ImportConfigDialogSubmission } from "@/components/ImportConfigDialog";
import { ALL_CACHE_KEYS, CacheKeys } from "./fetchers";

export async function removeEmptyGroups() {
    await invoke("remove_empty_groups");

    await revalidate(CacheKeys.LINK_GROUPS);
}

export async function purge() {
    await invoke("purge_links");

    await revalidate(ALL_CACHE_KEYS);
}

export function duplicatesExistInFile(path: string) {
    return invoke("check_for_duplicates", {
        path,
    });
}

export async function importFromFile(
    path: string,
    config: ImportConfigDialogSubmission,
): Promise<boolean> {
    const dupesExist: boolean = await invoke("import_from_file", {
        path,
        config,
    });

    await revalidate(ALL_CACHE_KEYS);

    return dupesExist;
}

export function saveDataToPath(path: string) {
    return invoke("save_data", { path });
}

export function exportOnetabDataToPath(path: string) {
    return invoke("export_for_onetab", { path });
}

export async function removeLink(id: number) {
    await invoke("remove_link", {
        id,
    });
    await revalidate([CacheKeys.LINK_GROUPS, CacheKeys.DUPES]);
}

export async function removeGroup(id: number) {
    await invoke("remove_group", {
        id,
    });
    await revalidate([CacheKeys.LINK_GROUPS]);
}

export async function removeTag(name: string) {
    await invoke("remove_tag", {
        name,
    });

    await revalidate(CacheKeys.TAGS);
}

export async function addLink(groupId: number, uri: string, title: string) {
    await invoke("add_link", {
        groupId,
        uri,
        title,
    });

    await revalidate([CacheKeys.LINK_GROUPS, CacheKeys.LINKS, CacheKeys.DUPES]);
}

export async function addGroup() {
    await invoke("add_group");

    await revalidate(CacheKeys.LINK_GROUPS);
}

export async function addTag(name: string) {
    await invoke("add_tag", {
        name,
    });

    await revalidate(CacheKeys.TAGS);
}

export async function toggleTagForLink(tag: string, uri: string) {
    await invoke("toggle_tag", {
        linkUri: uri,
        tagName: tag,
    });

    revalidate(CacheKeys.TAGS);
}
