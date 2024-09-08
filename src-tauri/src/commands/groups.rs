use crate::types::{LinkGroup, LinksContainer};
use std::{borrow::BorrowMut, collections::VecDeque};
use tauri::State;

#[tauri::command]
pub fn add_group(links: State<LinksContainer>) -> Result<(), String> {
    let mut lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.borrow_mut();

    link_groups
        .get_mut()
        .push_front(LinkGroup::new(VecDeque::new()));

    Ok(())
}

#[tauri::command]
pub fn remove_group(links: State<LinksContainer>, id: usize) -> Result<(), String> {
    let mut lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.borrow_mut().get_mut();

    let position = link_groups
        .iter()
        .position(|link_group| link_group.id == id)
        .ok_or(String::from("Group Not Found"))?;

    link_groups.remove(position);

    Ok(())
}

#[tauri::command]
pub fn remove_empty_groups(links: State<LinksContainer>) -> Result<(), String> {
    let mut lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.borrow_mut().get_mut();

    let groups_to_remove = link_groups
        .iter()
        .enumerate()
        .filter(|(_, group)| group.links.is_empty())
        .map(|(i, _)| i)
        .rev()
        .collect::<Vec<_>>();

    for group in groups_to_remove {
        link_groups.remove(group);
    }

    Ok(())
}
