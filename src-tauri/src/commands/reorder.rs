use tauri::State;

use crate::types::{Link, LinksContainer};

#[tauri::command]
pub fn reorder_group(
    links: State<LinksContainer>,
    group_id: usize,
    position: usize,
) -> Result<(), String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let mut link_groups = lock.borrow_mut();

    let group_pos = link_groups
        .iter()
        .position(|group| group.id == group_id)
        .ok_or("Group matching provided id not found")?;

    let group = link_groups
        .remove(group_pos)
        .expect("Matched group not found");

    link_groups.insert(position, group);

    Ok(())
}

#[tauri::command]
pub fn reorder_link(
    links: State<LinksContainer>,
    link_id: usize,
    group_id: usize,
    position_in_group: usize,
) -> Result<(), String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let mut link_groups = lock.borrow_mut();

    let link: Link = {
        let mut matched_link: Option<Link> = None;

        for group in link_groups.iter_mut() {
            for (pos, link) in group.links.clone().iter().enumerate() {
                if link.id == link_id {
                    matched_link = group.links.remove(pos);
                }
            }
        }

        matched_link.ok_or("Link matching provided id not found")?
    };

    let group = link_groups
        .iter_mut()
        .find(|group| group.id == group_id)
        .ok_or("Group matching provided id not found")?;

    group.links.insert(position_in_group, link);

    Ok(())
}
