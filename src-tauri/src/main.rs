// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod queries;
mod types;

use types::{LinksContainer, TagsContainer};

use commands::{
    add_group, add_link, add_tag, check_for_duplicates, export_for_onetab, import_from_file,
    purge_links, remove_empty_groups, remove_group, remove_link, remove_tag, reorder_group,
    reorder_link, save_data, toggle_tag,
};

use queries::{get_links, get_tags, get_tags_for_link, resolve_dupes, search};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

fn main() {
    let links = LinksContainer::default();
    let tags = TagsContainer::default();

    tauri::Builder::default()
        .manage(links)
        .manage(tags)
        .invoke_handler(tauri::generate_handler![
            add_group,
            add_link,
            add_tag,
            check_for_duplicates,
            export_for_onetab,
            get_links,
            get_tags_for_link,
            get_tags,
            import_from_file,
            purge_links,
            remove_empty_groups,
            remove_group,
            remove_link,
            remove_tag,
            reorder_group,
            reorder_link,
            resolve_dupes,
            save_data,
            search,
            toggle_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
