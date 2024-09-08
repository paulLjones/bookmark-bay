use std::collections::VecDeque;

use tauri::State;

use crate::types::{Link, LinksContainer};

#[tauri::command]
pub fn add_link(
    links: State<LinksContainer>,
    group_id: usize,
    uri: String,
    title: String,
) -> Result<(), String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let mut link_groups = lock.borrow_mut();

    let group = link_groups
        .iter_mut()
        .find(|link_group| link_group.id == group_id)
        .ok_or(format!("Group {} wasn't found", group_id))?;

    group
        .links
        .push_front(Link::new(uri, title, VecDeque::new().into()));

    Ok(())
}

#[tauri::command]
pub fn remove_link(links: State<LinksContainer>, id: usize) -> Result<(), String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let mut link_groups = lock.borrow_mut();

    link_groups.iter_mut().for_each(|link_group| {
        let item_to_remove = link_group.links.iter().position(|link| link.id == id);

        if let Some(item) = item_to_remove {
            link_group.links.remove(item);
        }
    });

    Ok(())
}
