use std::{
    cell::RefCell,
    collections::{BTreeSet, VecDeque},
    sync::{
        atomic::{AtomicUsize, Ordering},
        Mutex,
    },
};

use serde::{Deserialize, Serialize};

fn get_new_id() -> usize {
    static mut LAST_ID: AtomicUsize = AtomicUsize::new(0);

    unsafe { LAST_ID.fetch_add(1, Ordering::Release) }
}

#[derive(Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct Link {
    pub id: usize,
    pub uri: String,
    pub title: String,
    pub tags: Vec<String>,
}

#[derive(Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct StorableLink {
    pub uri: String,
    pub title: String,
    pub tags: Vec<String>,
}

impl Link {
    pub fn new(uri: String, title: String, tags: Vec<String>) -> Link {
        Link {
            id: get_new_id(),
            uri,
            title,
            tags,
        }
    }
}

impl From<StorableLink> for Link {
    fn from(value: StorableLink) -> Self {
        Link {
            id: get_new_id(),
            uri: value.uri,
            title: value.title,
            tags: value.tags,
        }
    }
}

impl From<Link> for StorableLink {
    fn from(value: Link) -> Self {
        StorableLink {
            uri: value.uri,
            title: value.title,
            tags: value.tags,
        }
    }
}

#[derive(Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct LinkGroup {
    pub id: usize,
    pub links: VecDeque<Link>,
}

#[derive(Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Clone, Debug)]
pub struct StorableLinkGroup {
    pub links: VecDeque<StorableLink>,
}

impl LinkGroup {
    pub fn new(links: VecDeque<Link>) -> LinkGroup {
        LinkGroup {
            id: get_new_id(),
            links,
        }
    }
}

impl From<StorableLinkGroup> for LinkGroup {
    fn from(value: StorableLinkGroup) -> Self {
        LinkGroup {
            id: get_new_id(),
            links: value.links.into_iter().map(|link| link.into()).collect(),
        }
    }
}

impl From<LinkGroup> for StorableLinkGroup {
    fn from(value: LinkGroup) -> Self {
        StorableLinkGroup {
            links: value.links.into_iter().map(|link| link.into()).collect(),
        }
    }
}

pub type LinkGroups = VecDeque<LinkGroup>;
pub type LinksContainer = Mutex<RefCell<LinkGroups>>;

pub type TagsContainer = Mutex<RefCell<BTreeSet<String>>>;

#[derive(Deserialize, Serialize, Debug)]
pub struct SaveData {
    pub tags: Vec<String>,
    pub link_groups: Vec<StorableLinkGroup>,
}
