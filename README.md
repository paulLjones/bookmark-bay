# Bookmark Bay

## Project Summary

This desktop application is designed to allow for the efficient retrevial of bookmarks collected via the OneTab extension.
It also contains features to help reorganize OneTab data for reimport.

## Doc Link

### Technical Decisions

[Why choose this tech stack?](/docs/why-tech-stack.md)

[Why Implement Drag & Drop Sorting?](/docs/why-is-there-a-drag-and-drop-sorting-implementation.md)

### Takeaways

[Strengths of the React ecosystem](/docs/react-ecosystem-strengths.md)

## Tech Stack

### Languages:

-   Solidjs with Typescript
-   Rust

### Libraries:

-   Solid Router
-   Tanstack Virtualizer

### Build Tools:

-   PNPM (JS Package mangement)
-   Vite
-   Cargo (Rust Package management)

## Setup Instructions

1. Install language dependancies

-   NodeJS

    [Nodejs Download](https://nodejs.org/en/download)

-   PNPM (after installing node)

    Enable corepack

    `corepack enable`

-   Rust

    [Install Rustup (Rust Version Manager)](https://www.rust-lang.org/tools/install)

2. Install native tauri dependancies:

    [Tauri Offical Prerequisites Guide](https://tauri.app/v1/guides/getting-started/prerequisites)

3. Install project dependancies

-   Node Dependancies:

    `pnpm i`

-   Rust Dependancies

    `cd src-tauri && cargo install`

4. Run in dev

    `pnpm tauri dev`

5. Build for producion

    `pnpm tauri build`
