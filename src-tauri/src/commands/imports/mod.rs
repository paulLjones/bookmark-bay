use core::ImportConfig;

use tauri::State;

use crate::types::{LinksContainer, TagsContainer};

mod core;

#[tauri::command]
pub fn check_for_duplicates(links: State<LinksContainer>, path: String) -> Result<bool, String> {
    let file_as_string = std::fs::read_to_string(path).map_err(|e| match e.kind() {
        std::io::ErrorKind::InvalidData => "Unable to read file".to_string(),
        _ => e.to_string(),
    })?;

    if file_as_string.is_empty() {
        return Err("File is empty".to_string());
    }

    let mut links_lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = links_lock.get_mut();

    core::check_for_duplicates(file_as_string, link_groups)
}

#[tauri::command]
pub fn import_from_file(
    links: State<LinksContainer>,
    tags: State<TagsContainer>,
    path: String,
    config: ImportConfig,
) -> Result<bool, String> {
    let file_as_string = std::fs::read_to_string(path).map_err(|e| match e.kind() {
        std::io::ErrorKind::InvalidData => "Unable to read file".to_string(),
        _ => e.to_string(),
    })?;

    if file_as_string.is_empty() {
        return Err("File is empty".to_string());
    }

    let mut links_lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = links_lock.get_mut();

    let mut tags_lock = tags.lock().map_err(|e| e.to_string())?;
    let tags = tags_lock.get_mut();

    core::import_from_file(file_as_string, link_groups, tags, config)
}
