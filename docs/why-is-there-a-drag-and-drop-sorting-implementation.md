# Why is there a Drag & Drop sorting implementation?

## Summary

-   The Grouped page uses a virtualiser, and therefore doesn't have all the elements present in the DOM.

-   All the Drag & Drop sorting implementations I could find for Solid.js assumed all the elements would be present and remain in the DOM.

-   As a result I had to implement my own version to suit the app.

## Design

-   The api design was inspired by solid sortable, which is inspired by react-dnd-kit, an extremely popular and versatile DnD implementation.

-   My main change was to instead manually keep track of all items that are loaded as the user scrolls as the virtual list scrolls. The implementations I found assumed a static list of items and therefore broke when one was removed from the DOM by the list virtualiser.

## Why not remove the virtualiser?

-   I did try this but the load time of the page component was significantly worsened. There is no computation so I believe the slow down was mainly due to the cost of setting up all the signals, as subscribing to signals is the slowest part of a signal framework.

-   Signal subscription is performed by creating closures which adds to the overhead.

-   The slow down was so out of place from the rest of the app I decided implementing a Drag & Drop sorting was the only viable approach for a good UX.
