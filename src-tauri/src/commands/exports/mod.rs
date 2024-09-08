use std::{
    fs::File,
    io::{BufWriter, Write},
};

use tauri::State;

use crate::types::{LinksContainer, SaveData, TagsContainer};

#[tauri::command]
pub fn save_data(
    links: State<LinksContainer>,
    tags: State<TagsContainer>,
    path: String,
) -> Result<(), String> {
    let mut links_lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = links_lock.get_mut();

    let mut tags_lock = tags.lock().map_err(|e| e.to_string())?;
    let tags = tags_lock.get_mut();

    let save_data = SaveData {
        tags: tags.iter().map(|tag| tag.to_owned()).collect(),
        link_groups: link_groups
            .clone()
            .into_iter()
            .map(|group| group.into())
            .collect(),
    };

    {
        let writer = BufWriter::new(File::create(path).map_err(|e| e.to_string())?);

        serde_json::to_writer(writer, &save_data).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn export_for_onetab(links: State<LinksContainer>, path: String) -> Result<(), String> {
    let mut lock = links.lock().map_err(|e| e.to_string())?;
    let link_groups = lock.get_mut();

    {
        let mut writer = BufWriter::new(File::create(path).map_err(|e| e.to_string())?);

        link_groups.iter().for_each(|group| {
            group.links.iter().for_each(|link| {
                writeln!(&mut writer, "{} | {}", link.uri, link.title)
                    .expect("Unable to write line");
            });

            writeln!(&mut writer).expect("Unable to write line");
        });
    }

    Ok(())
}
