use tauri::State;

use crate::types::{LinksContainer, TagsContainer};

#[tauri::command]
pub fn purge_links(links: State<LinksContainer>, tags: State<TagsContainer>) -> Result<(), String> {
    let mut links_lock = links.lock().map_err(|e| e.to_string())?;
    let links = links_lock.get_mut();

    links.clear();

    let mut tags_lock = tags.lock().map_err(|e| e.to_string())?;
    let tags = tags_lock.get_mut();

    tags.clear();

    Ok(())
}
