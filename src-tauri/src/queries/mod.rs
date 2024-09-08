use std::collections::BTreeMap;

use serde::Serialize;
use tauri::State;

use crate::types::{Link, LinkGroup, LinkGroups, LinksContainer, TagsContainer};

#[tauri::command]
pub fn get_links(links: State<LinksContainer>) -> Result<LinkGroups, String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let links = lock.borrow();

    Ok(links.to_owned())
}

#[tauri::command]
pub fn search(
    links: State<LinksContainer>,
    search_text: Option<String>,
    sort_by: String,
    sort_direction: String,
    tag: Option<String>,
) -> Result<Vec<Link>, String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.borrow();

    let mut base_iter = link_groups.iter().flat_map(|group| group.links.to_owned());

    let mut filtered_iter;

    let link_iter: &mut dyn Iterator<Item = Link>;

    if let Some(ref text) = search_text {
        filtered_iter = base_iter.filter(|link| {
            !text.trim().is_empty() && link.title.to_lowercase().contains(&text.to_lowercase())
        });

        link_iter = &mut filtered_iter;
    } else {
        link_iter = &mut base_iter;
    }

    let mut links;

    if let Some(ref tag) = tag {
        links = link_iter
            .filter(|link| link.tags.contains(tag))
            .collect::<Vec<Link>>();
    } else {
        links = link_iter.collect::<Vec<Link>>()
    }

    links.sort_by_key(|link| match sort_by.as_str() {
        "title" => link.title.to_owned(),
        "uri" => link.uri.to_owned(),
        _ => link.title.to_owned(),
    });

    if "desc" == sort_direction.as_str() {
        links.reverse();
    }

    Ok(links)
}

#[derive(Default, Serialize)]
pub struct ResolveDupeItem {
    dupes_left: usize,
    key: String,
    groups: Vec<LinkGroup>,
}

impl PartialEq for ResolveDupeItem {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
}

#[tauri::command]
pub fn resolve_dupes(links: State<LinksContainer>) -> Result<ResolveDupeItem, String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.borrow();

    let mut map = BTreeMap::<&String, Vec<&LinkGroup>>::new();

    for group in link_groups.iter() {
        for link in group.links.iter() {
            if let Some(vec) = map.get_mut(&link.uri) {
                if !vec.contains(&group) {
                    vec.push(group);
                }
            } else {
                let vec = vec![group];

                map.insert(&link.uri, vec);
            }
        }
    }

    let mut iter = map.iter().filter(|(_, vec)| vec.len() > 1);

    let result = iter
        .next()
        .map(|(key, groups)| {
            let groups = groups
                .iter()
                .map(|group| (*group).clone())
                .collect::<Vec<LinkGroup>>();

            let key = key.to_string();

            ResolveDupeItem {
                dupes_left: 1 + iter.count(),
                key,
                groups,
            }
        })
        .unwrap_or_default();

    Ok(result)
}

#[tauri::command]
pub fn get_tags(
    tags: State<TagsContainer>,
    search_text: Option<String>,
    sort_direction: Option<String>,
) -> Result<Vec<String>, String> {
    let lock = tags.lock().map_err(|e| e.to_string())?;
    let tags = lock.borrow();

    let mut result = Vec::with_capacity(tags.len());

    if let Some(ref search) = search_text {
        tags.iter()
            .filter(|tag| tag.contains(search))
            .for_each(|tag| result.push(tag.to_owned()))
    } else {
        tags.iter().for_each(|tag| result.push(tag.to_owned()));
    }

    if Some("desc".to_string()) == sort_direction {
        result.reverse();
    }

    Ok(result)
}

#[tauri::command]
pub fn get_tags_for_link(
    links: State<LinksContainer>,
    id: usize,
) -> Result<Vec<String>, std::string::String> {
    let lock = links.lock().map_err(|e| e.to_string())?;
    let links = lock.borrow();

    let link = links
        .iter()
        .flat_map(|link_group| &link_group.links)
        .find(|link| link.id == id);

    match link {
        Some(link) => Ok(link.tags.to_owned()),
        None => Ok(Vec::new()),
    }
}
