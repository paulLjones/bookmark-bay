# Why choose this tech stack?

The main reason was a deep interest in the values and portability of Tauri.

## Values

### Security

-   Tauri values security and is regularly audited for security issues. A Tauri backend directly communicates with the frontend via IPC and not via a client-server connection (unlike Electron), which reduces the potential attack area.

-   Rust's performance & safety encourages non-ui code to be handled by Rust where the behaviour is more concrete and not susceptible to common issues in dynamically typed languages.

-   For this app, security isn't a significant concern, but there's value in gaining experience with the technology to better inform decisions for projects that would benefit.

### Space Efficiency

-   Tauri uses the native web-view of the operating system, which significantly reduces disk-space usage and download time as it doesn't have to ship a Chrome Browser and Node Server.

-   This also has the side effect of improving security as the app itself doesn't have to ship security fixes for it's browser as the Operating System will do it. A locked down native application is also generally more secure then a full Node.js server.

## Rust

-   I wanted to write more Rust, and the Rust language has the benefit of letting you write functional-style (ala Scala, Haskell and others) code in a familar c-style syntax.

-   This made implementing the app easier as I didn't have to worry about some sort of storage layer, and instead simply perform map-reduce operations on a Vec in memory. Which keeps the code simple and works well with the tiny memory requirements of the application.

## Solid JS

-   I wanted to use Solid for an actual app to see how well it worked. I enjoyed the React style DX and the mental model of signals, but ran into rough edges regarding libraries.

-   The ecosystem state was something I was curious about and whilst healthy it doesn't hold a candle to React's due to being newer and being used less in the market.
