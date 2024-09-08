use tauri::State;

use crate::types::{LinksContainer, TagsContainer};

#[tauri::command]
pub fn add_tag(tags: State<TagsContainer>, name: String) -> Result<(), String> {
    let lock = tags.lock().map_err(|e| e.to_string())?;
    let mut tags = lock.borrow_mut();

    tags.insert(name);

    Ok(())
}

#[tauri::command]
pub fn remove_tag(tags: State<TagsContainer>, name: String) -> Result<(), String> {
    let lock = tags.lock().map_err(|e| e.to_string())?;
    let mut tags = lock.borrow_mut();

    tags.remove(&name);

    Ok(())
}

#[tauri::command]
pub fn toggle_tag(
    links: State<LinksContainer>,
    link_uri: String,
    tag_name: String,
) -> Result<(), String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let mut link_groups = lock.borrow_mut();

    let matched = link_groups
        .iter()
        .enumerate()
        .flat_map(|(group_id, group)| {
            group
                .links
                .iter()
                .enumerate()
                .map(|(link_id, link)| (group_id, link_id, link.clone()))
                .collect::<Vec<_>>()
                .to_owned()
        })
        .find(|(_, _, link)| link.uri == link_uri);

    if let Some((group_id, link_id, _)) = matched {
        link_groups
            .get_mut(group_id)
            .and_then(|group| group.links.get_mut(link_id))
            .map(|link| {
                let indx = link.tags.iter().position(|tag| tag == &tag_name);

                if let Some(i) = indx {
                    link.tags.remove(i);
                } else {
                    link.tags.push(tag_name);
                }
            })
            .expect("Passed ids not valid");
    }

    Ok(())
}
