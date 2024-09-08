use std::collections::{BTreeSet, VecDeque};

use serde::Deserialize;

use crate::types::{Link, LinkGroup, SaveData};

pub fn check_for_duplicates(
    file_as_string: String,
    link_groups: &VecDeque<LinkGroup>,
) -> Result<bool, String> {
    let mut import_buffer = VecDeque::<LinkGroup>::new();

    match &file_as_string[0..1] {
        "h" => one_tab_import(file_as_string, &mut import_buffer),
        "{" => json_import(file_as_string, &mut import_buffer, None),
        _ => Err("Corrupted file or invalid format".to_string()),
    }?;

    let existing_links = link_groups
        .iter()
        .flat_map(|group| &group.links)
        .map(|link| &link.uri)
        .collect::<BTreeSet<&String>>();

    let duplicate_exists = import_buffer.iter().any(|group| {
        group
            .links
            .iter()
            .any(|link| existing_links.contains(&link.uri))
    });

    Ok(duplicate_exists)
}

#[derive(Deserialize)]
pub enum ImportStrategy {
    KeepAll,
    KeepExisting,
}

#[derive(Deserialize)]
pub enum InsertPosition {
    Before,
    After,
}

#[derive(Deserialize)]
pub struct ImportConfig {
    strategy: ImportStrategy,
    position: InsertPosition,
}

pub fn import_from_file(
    file_as_string: String,
    link_groups: &mut VecDeque<LinkGroup>,
    tags: &mut BTreeSet<String>,
    config: ImportConfig,
) -> Result<bool, String> {
    let mut import_buffer = VecDeque::<LinkGroup>::new();

    match &file_as_string[0..1] {
        "h" => one_tab_import(file_as_string, &mut import_buffer),
        "{" => json_import(file_as_string, &mut import_buffer, Some(tags)),
        _ => Err("Corrupted file or invalid format".to_string()),
    }?;

    let existing_links = link_groups
        .iter()
        .flat_map(|group| &group.links)
        .map(|link| &link.uri)
        .cloned()
        .collect::<BTreeSet<String>>();

    {
        let mut add_group: Box<dyn FnMut(LinkGroup)> = {
            match config.position {
                InsertPosition::Before => {
                    Box::new(|group: LinkGroup| link_groups.push_front(group))
                }
                InsertPosition::After => Box::new(|group: LinkGroup| link_groups.push_back(group)),
            }
        };

        let iter: Box<dyn Iterator<Item = &LinkGroup>> = {
            let iter = import_buffer.iter();

            match config.position {
                InsertPosition::Before => Box::new(iter.rev()),
                InsertPosition::After => Box::new(iter),
            }
        };

        match config.strategy {
            ImportStrategy::KeepAll => {
                for group in iter {
                    add_group(group.clone());
                }
            }
            ImportStrategy::KeepExisting => {
                for group in iter {
                    let mut mut_group = group.clone();

                    let link_iter: Box<dyn Iterator<Item = &Link>> = {
                        let iter = group.links.iter();

                        match config.position {
                            InsertPosition::Before => Box::new(iter.rev()),
                            InsertPosition::After => Box::new(iter.into_iter()),
                        }
                    };

                    for (index, link) in link_iter.enumerate() {
                        if existing_links.contains(&link.uri) {
                            mut_group.links.remove(index);
                        }
                    }

                    if !mut_group.links.is_empty() {
                        add_group(mut_group);
                    }
                }
            }
        }
    }

    {
        let mut set = BTreeSet::<&String>::new();

        for group in link_groups.iter() {
            for link in group.links.iter() {
                let unique = set.insert(&link.uri);

                if !unique {
                    return Ok(true);
                }
            }
        }
    }

    Ok(false)
}

fn one_tab_import(
    file_as_string: String,
    link_groups: &mut VecDeque<LinkGroup>,
) -> Result<(), String> {
    let mut link_buf = VecDeque::<Link>::new();

    let lines = file_as_string.lines().rev();

    for line in lines {
        if let Some((uri, title)) = line.split_once('|') {
            let uri = uri.trim().to_string();

            if !(uri.starts_with("https://") || uri.starts_with("http://")) {
                return Err(format!("Invalid URI: '{}'", uri));
            }

            let title = title.trim().to_string();

            if title.is_empty() {
                return Err(format!("Missing title for uri: '{}'", uri));
            }

            link_buf.push_front(Link::new(uri, title, Vec::new()));
        } else if !link_buf.is_empty() {
            link_groups.push_front(LinkGroup::new(link_buf.clone()));

            link_buf = VecDeque::<Link>::new();
        }
    }

    if !link_buf.is_empty() {
        link_groups.push_front(LinkGroup::new(link_buf.clone()));
    }

    Ok(())
}

fn json_import(
    file_as_string: String,
    link_groups: &mut VecDeque<LinkGroup>,
    tags: Option<&mut BTreeSet<String>>,
) -> Result<(), String> {
    let save_data = serde_json::from_str::<SaveData>(&file_as_string)
        .or(Err("Corrupted file or invalid format"))?;

    save_data
        .link_groups
        .iter()
        .rev()
        .for_each(|link| link_groups.push_front(link.to_owned().into()));

    if let Some(tags) = tags {
        save_data.tags.iter().for_each(|tag| {
            tags.insert(tag.to_owned());
        });
    }

    Ok(())
}
