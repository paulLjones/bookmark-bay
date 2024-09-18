import { type VirtualItem, createVirtualizer } from "@tanstack/solid-virtual";
import {
    type Accessor,
    type Setter,
    For,
    JSX,
    Show,
    createContext,
    createSignal,
    useContext,
} from "solid-js";
import { type SetStoreFunction, produce } from "solid-js/store";
import { Portal } from "solid-js/web";
import { removeGroup, removeLink } from "@/api/actions";
import createAddLinkDialog from "@/components/AddLinkDialog";
import Button from "@/components/Button";
import createTagAssignDialog from "@/components/TagAssignDialog";
import type { Link, LinkGroup } from "@/types";
import getLinkHeight from "@/utils/getLinkHeight";
import createAutoScroller from "@/utils/createAutoScroller";
import { invoke } from "@tauri-apps/api";
import { CacheKeys } from "@/api/fetchers";
import { revalidate } from "@solidjs/router";

const LINK_HEIGHT = getLinkHeight() + 1;
const PADDING = 16;
const BORDERS = 2;
const STATIC_SPACING = PADDING + BORDERS - 1; // -1 from last link in group not having a dividing border

function estimateSize(linkGroup: LinkGroup): number {
    return (linkGroup.links.length + 1) * LINK_HEIGHT + STATIC_SPACING;
}

type GroupMove = { type: "group"; groupId: number; position: number };

type LinkMove = {
    type: "link";
    linkId: number;
    groupId: number;
    positionInGroup: number;
};

type SwapType = GroupMove | LinkMove;

type GroupedTableProps = {
    linkGroups: LinkGroup[];
    setLinkGroups: SetStoreFunction<LinkGroup[]>;
};

// We store the element to make sure we don't drop & miss the drag end event
type DraggedData = { id: number; type: "group" | "link"; el: Element };

type GroupedTableContext = {
    setLinkGroups: SetStoreFunction<LinkGroup[]>;
    draggedData: Accessor<DraggedData | undefined>;
    setDraggedData: Setter<DraggedData | undefined>;
    setLastSwap: Setter<SwapType | undefined>;
    onAutoscrollerMove: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;
};

const GroupedTableContext = createContext<GroupedTableContext>(undefined);

function useGroupedTableContext() {
    const context = useContext(GroupedTableContext);

    if (context === undefined) {
        throw new Error("Context is not defined");
    }

    return context;
}

export default function GroupedTable(props: GroupedTableProps) {
    return (
        <Show
            when={props.linkGroups.length}
            fallback={
                <div>
                    <p class="p-3">No links are currently loaded</p>
                </div>
            }
        >
            <VirtualList
                linkGroups={props.linkGroups}
                setLinkGroups={props.setLinkGroups}
            />
        </Show>
    );
}

function VirtualList(props: GroupedTableProps) {
    let scrollElement!: HTMLUListElement;
    let containerElement!: HTMLDivElement;

    const { onAutoscrollerMove, cancelAutoscroller } = createAutoScroller(
        () => containerElement,
    );

    const virtualizer = createVirtualizer({
        get count() {
            return props.linkGroups.length ?? 0;
        },
        getScrollElement: () => scrollElement as Element | null,
        estimateSize: (i: number) => estimateSize(props.linkGroups[i]),
        getItemKey: (i: number) => props.linkGroups[i].id,
    });

    return (
        <GroupedTableContextProvider
            setLinkGroups={(...args: unknown[]) => {
                // @ts-expect-error solidjs-types
                return props.setLinkGroups(...args);
            }}
            onAutoscrollerMove={onAutoscrollerMove}
            cancelAutoscroller={cancelAutoscroller}
        >
            <ul
                class="relative w-full flex-grow flex-col overflow-scroll border-0"
                ref={scrollElement}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        "min-height": "100%",
                        position: "relative",
                        contain: "strict",
                    }}
                    ref={containerElement}
                >
                    <For
                        each={virtualizer
                            .getVirtualItems()
                            .filter(
                                (virtualItem) =>
                                    props.linkGroups[virtualItem.index],
                            )}
                    >
                        {(virtualItem) => (
                            <GroupedTableItem
                                virtualItem={virtualItem}
                                linkGroup={props.linkGroups[virtualItem.index]}
                            />
                        )}
                    </For>
                </div>
            </ul>
        </GroupedTableContextProvider>
    );
}

function GroupedTableItem(props: {
    virtualItem: VirtualItem<Element>;
    linkGroup: LinkGroup | undefined;
}) {
    const { showModal, AddLinkDialog } = createAddLinkDialog();
    const {
        setLinkGroups,
        draggedData,
        setDraggedData,
        onAutoscrollerMove,
        onDragEnd,
        setLastSwap,
    } = useGroupedTableContext();

    function dragHandler(e: DragEvent & { currentTarget: HTMLDivElement }) {
        const { id, type } = draggedData()!;

        if (id === undefined || id === props.linkGroup!.id) {
            return;
        }

        setLinkGroups(
            produce(
                linkGroupMutation(e, props.linkGroup!, id, type, setLastSwap),
            ),
        );
    }

    const beingDragged = () =>
        draggedData()?.id === props.linkGroup!.id &&
        draggedData()?.type === "group";

    return (
        <li
            class="w-full px-4 py-2"
            data-index={props.virtualItem.index}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translateY(${props.virtualItem.start ?? 0}px)`,
            }}
        >
            <div
                class="min-h-fit rounded border"
                style={{
                    opacity: beingDragged() ? 0.5 : 1,
                }}
                draggable={true}
                onDragOver={dragHandler}
                onDrag={onAutoscrollerMove}
                onDragEnd={onDragEnd}
                onDragStart={(e) =>
                    onGroupDragStart(
                        e,
                        props.linkGroup!,
                        draggedData,
                        setDraggedData,
                    )
                }
            >
                <div class="flex border-b border-gray-600 p-3">
                    <span class="flex flex-1 items-center">
                        Group: {props.linkGroup!.id}
                    </span>

                    <div class="flex gap-3">
                        <Button
                            color="blue"
                            onClick={(e) => {
                                e.stopImmediatePropagation();
                                showModal();
                            }}
                            rounded
                        >
                            Add Link
                        </Button>

                        <Button
                            color="red"
                            onClick={(e) => {
                                e.stopImmediatePropagation();
                                removeGroup(props.linkGroup!.id);
                            }}
                            rounded
                        >
                            Del
                        </Button>
                    </div>
                </div>
                <ul>
                    <For each={props.linkGroup!.links}>
                        {(link) => <GroupedTableItemLink link={link} />}
                    </For>
                </ul>
            </div>

            <Portal>
                <AddLinkDialog linkGroup={props.linkGroup!} />
            </Portal>
        </li>
    );
}

function GroupedTableItemLink(props: { link: Link }) {
    const { showModal, TagAssignDialog } = createTagAssignDialog();
    const {
        setLinkGroups,
        draggedData,
        setDraggedData,
        onAutoscrollerMove,
        onDragEnd,
        setLastSwap,
    } = useGroupedTableContext();

    function dragHandler(e: DragEvent & { currentTarget: HTMLLIElement }) {
        const { id, type } = draggedData()!;

        if (id === undefined || id === props.link.id || type === "group") {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        setLinkGroups(produce(linkMutation(e, id, props.link, setLastSwap)));
    }

    const beingDragged = () =>
        draggedData()?.id === props.link.id && draggedData()?.type === "link";

    return (
        <>
            <li
                class="flex overflow-hidden border-b border-gray-600 last-of-type:border-b-0"
                style={{
                    opacity: beingDragged() ? 0.5 : 1,
                }}
                draggable={true}
                onDragOver={dragHandler}
                onDrag={onAutoscrollerMove}
                onDragEnd={onDragEnd}
                onDragStart={(e) =>
                    onLinkDragStart(e, props.link, draggedData, setDraggedData)
                }
            >
                <div class="flex min-w-0 flex-1 flex-shrink-0 items-center overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-600 p-3">
                    {props.link.title}
                </div>
                <div class="flex items-center justify-center gap-3 p-3">
                    <a
                        class="rounded bg-blue-600 px-3 py-2 hover:bg-blue-400"
                        href={props.link.uri}
                        target="_blank"
                    >
                        Open
                    </a>

                    <Button
                        color="blue"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showModal();
                        }}
                        rounded
                    >
                        Assign Tags
                    </Button>

                    <Button
                        color="red"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            removeLink(props.link.id);
                        }}
                        rounded
                    >
                        Del
                    </Button>
                </div>
            </li>
            <Portal mount={document.body}>
                <TagAssignDialog data={props.link} />
            </Portal>
        </>
    );
}

function GroupedTableContextProvider(props: {
    setLinkGroups: SetStoreFunction<LinkGroup[]>;
    onAutoscrollerMove: (e: DragEvent) => void;
    cancelAutoscroller: () => void;
    children: JSX.Element;
}) {
    const [draggedData, setDraggedData] = createSignal<DraggedData | undefined>(
        undefined,
    );

    const [lastSwap, setLastSwap] = createSignal<SwapType | undefined>(
        undefined,
    );

    function onDragEnd(e: DragEvent) {
        props.cancelAutoscroller();

        e.stopPropagation();
        e.dataTransfer?.clearData();
        setDraggedData(undefined);

        const result = lastSwap();

        if (!result) return;

        if (result.type === "group") {
            invoke("reorder_group", {
                ...result,
            });
        } else {
            invoke("reorder_link", {
                ...result,
            });
        }

        revalidate(CacheKeys.LINK_GROUPS);
    }

    return (
        <GroupedTableContext.Provider
            value={{
                draggedData,
                setDraggedData,
                setLastSwap,
                onDragEnd,
                onAutoscrollerMove: (e) => props.onAutoscrollerMove(e),
                setLinkGroups: (...args: unknown[]) => {
                    // @ts-expect-error solidjs-types
                    return props.setLinkGroups(...args);
                },
            }}
        >
            {props.children}
        </GroupedTableContext.Provider>
    );
}

function onGroupDragStart(
    e: DragEvent & { currentTarget: HTMLElement },
    linkGroup: LinkGroup,
    draggedData: Accessor<DraggedData | undefined>,
    setDraggedData: Setter<DraggedData | undefined>,
) {
    e.stopPropagation();

    const el = e.currentTarget.cloneNode(true) as (typeof e)["currentTarget"];
    el.classList.add("text-white");
    el.style.width = `${e.currentTarget.clientWidth}px`;

    document.body.appendChild(el);

    e.dataTransfer?.setDragImage(el, e.offsetX, e.offsetY);
    e.dataTransfer?.setData("application/x-group-id", linkGroup.id.toString());

    if (draggedData()?.id !== linkGroup.id && draggedData()?.type !== "group") {
        setDraggedData({
            id: linkGroup.id,
            type: "group",
            el: e.currentTarget,
        });
    }

    requestAnimationFrame(() => {
        document.body.removeChild(el);
    });
}

function onLinkDragStart(
    e: DragEvent & { currentTarget: HTMLElement },
    link: Link,
    draggedData: Accessor<DraggedData | undefined>,
    setDraggedData: Setter<DraggedData | undefined>,
) {
    e.stopPropagation();

    const el = e.currentTarget.cloneNode(true) as (typeof e)["currentTarget"];
    el.classList.add("text-white");
    el.style.width = `${e.currentTarget.clientWidth}px`;

    document.body.appendChild(el);

    e.dataTransfer?.setDragImage(el, e.offsetX, e.offsetY);
    e.dataTransfer?.setData("application/x-link-id", link.id.toString());

    if (draggedData()?.id !== link.id && draggedData()?.type !== "link") {
        setDraggedData({
            id: link.id,
            type: "link",
            el: e.currentTarget,
        });
    }

    requestAnimationFrame(() => {
        document.body.removeChild(el);
    });
}

function linkGroupMutation(
    e: DragEvent & { currentTarget: Element },
    linkGroup: LinkGroup,
    id: number,
    type: string,
    setLastSwap: Setter<SwapType | undefined>,
) {
    return (linkGroups: LinkGroup[]) => {
        if (type === "group") {
            const groupIndex = linkGroups.findIndex((group) => group.id === id);

            if (groupIndex == -1) {
                throw new Error("Couldn't find group id: " + id);
            }

            const group = linkGroups.splice(groupIndex, 1)[0];

            const thisIndex = linkGroups.findIndex(
                (group) => group.id === linkGroup.id,
            );

            if (thisIndex == -1) {
                throw new Error(
                    "Couldn't find parent group for id: " + linkGroup.id,
                );
            }

            const rect = e.currentTarget.getBoundingClientRect();

            const insertBefore = e.clientY < rect.top + rect.height / 2;

            const position = insertBefore ? thisIndex : thisIndex + 1;

            linkGroups.splice(position, 0, group);

            setLastSwap({
                type: "group",
                groupId: group.id,
                position,
            } as SwapType);
        } else {
            const groupWithLinksIndex = linkGroups.findIndex(
                (group) =>
                    group.links.findIndex((link) => link.id === id) != -1,
            );

            if (groupWithLinksIndex == -1) {
                throw new Error("Couldn't find group with link id: " + id);
            }

            const group = linkGroups[groupWithLinksIndex];

            if (group.id === linkGroup!.id) {
                return;
            }

            const link = group.links.splice(
                group.links.findIndex((link) => link.id === id),
                1,
            )[0];

            const thisGroupIndex = linkGroups.findIndex(
                (group) => group.id === linkGroup!.id,
            );

            if (thisGroupIndex == -1) {
                throw new Error(
                    "Couldn't find parent group for id: " + linkGroup!.id,
                );
            }

            const thisGroup = linkGroups[thisGroupIndex];

            thisGroup.links.unshift(link);

            setLastSwap({
                type: "link",
                groupId: linkGroup.id,
                linkId: link.id,
                positionInGroup: 0,
            } as SwapType);
        }

        e.preventDefault();
        e.stopPropagation();
    };
}

function linkMutation(
    e: DragEvent & { currentTarget: Element },
    id: number,
    thisLink: Link,
    setLastSwap: Setter<SwapType | undefined>,
) {
    return (linkGroups: LinkGroup[]) => {
        e.stopPropagation();

        const groupWithLinksIndex = linkGroups.findIndex(
            (group) => group.links.findIndex((link) => link.id === id) != -1,
        );

        if (groupWithLinksIndex == -1) {
            throw new Error("Couldn't find link id: " + id);
        }

        const link = (() => {
            const group = linkGroups[groupWithLinksIndex];
            const linkIndex = group.links.findIndex((link) => link.id === id);

            return group.links.splice(linkIndex, 1)[0];
        })();

        const thisGroupIndex = linkGroups.findIndex(
            (group) =>
                group.links.findIndex((link) => link.id === thisLink.id) != -1,
        );

        if (thisGroupIndex == -1) {
            throw new Error(
                "Couldn't find parent group for id: " + thisLink.id,
            );
        }

        const thisGroup = linkGroups[thisGroupIndex];
        const thisIndex = thisGroup.links.findIndex(
            (link) => link.id === thisLink.id,
        );

        const rect = e.currentTarget.getBoundingClientRect();

        const insertBefore = e.clientY < rect.top + rect.height / 2;

        const position = insertBefore ? thisIndex : thisIndex + 1;

        thisGroup.links.splice(position, 0, link);

        setLastSwap({
            type: "link",
            groupId: thisGroup.id,
            linkId: link.id,
            positionInGroup: position,
        } as SwapType);
    };
}
