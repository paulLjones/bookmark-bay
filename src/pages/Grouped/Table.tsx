import { revalidate } from "@solidjs/router";
import {
    type VirtualItem,
    type VirtualizerOptions,
    createVirtualizer,
} from "@tanstack/solid-virtual";
import { invoke } from "@tauri-apps/api";
import { For, Show, createMemo, createSignal, onMount } from "solid-js";
import { type SetStoreFunction, reconcile } from "solid-js/store";
import { Portal } from "solid-js/web";
import { removeGroup, removeLink } from "@/api/actions";
import { CacheKeys } from "@/api/fetchers";
import createAddLinkDialog from "@/components/AddLinkDialog";
import Button from "@/components/Button";
import createTagAssignDialog from "@/components/TagAssignDialog";
import { Link, LinkGroup } from "@/types";
import getLinkHeight from "@/utils/getLinkHeight";
import { SortableOverlay, SortableProvider, createSortable } from "./Sortable";

const LINK_HEIGHT = getLinkHeight() + 1;
const PADDING = 16;
const BORDERS = 2;
const STATIC_SPACING = PADDING + BORDERS - 1; // -1 from last link in group not having a dividing border

function estimateSize(linkGroup: LinkGroup): number {
    return (linkGroup.links.length + 1) * LINK_HEIGHT + STATIC_SPACING;
}

type GroupedTableProps = {
    linkGroups: LinkGroup[];
    setLinkGroups: SetStoreFunction<LinkGroup[]>;
};

export default function GroupedTable(props: GroupedTableProps) {
    let scrollElement!: HTMLUListElement;
    let containerElement!: HTMLDivElement;

    const virtualizerConfig = createMemo(() => {
        return {
            count: props.linkGroups.length ?? 0,
            getScrollElement: () => scrollElement as Element | null,
            estimateSize: (i: number) => estimateSize(props.linkGroups[i]),
            getItemKey: (i: number) => props.linkGroups[i].id,
        } as VirtualizerOptions<Element, Element>;
    });

    // @ts-expect-error Tanstack type definitions aren't correct here
    const virtualizer = createVirtualizer(() => virtualizerConfig());

    const { onDragEnter, onDragEnd } = useDragDropImpl(props);

    return (
        <ul
            class="relative w-full flex-grow flex-col overflow-scroll border-0"
            ref={scrollElement}
        >
            <Show
                when={props.linkGroups.length}
                fallback={
                    <div>
                        <p class="p-3">No links are currently loaded</p>
                    </div>
                }
            >
                <SortableProvider
                    onDragEnter={onDragEnter}
                    onDragEnd={onDragEnd}
                    containerElement={() => containerElement}
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
                                    linkGroup={
                                        props.linkGroups[virtualItem.index]
                                    }
                                />
                            )}
                        </For>
                        <SortableOverlay>
                            {(draggedItem) => {
                                return draggedItem.data?.type == "group" ? (
                                    <GroupedTableItemOverlay
                                        groupNum={draggedItem.data.groupNum!}
                                        linkGroup={
                                            props.linkGroups.find(
                                                (linkGroup) =>
                                                    linkGroup.id ===
                                                    draggedItem.id,
                                            )!
                                        }
                                    />
                                ) : draggedItem.data?.type == "link" ? (
                                    <GroupedTableItemLinkOverlay
                                        link={
                                            props.linkGroups
                                                .flatMap((group) => group.links)
                                                .find(
                                                    (link) =>
                                                        link.id ===
                                                        draggedItem.id,
                                                )!
                                        }
                                    />
                                ) : null;
                            }}
                        </SortableOverlay>
                    </div>
                </SortableProvider>
            </Show>
        </ul>
    );
}

function useDragDropImpl(props: GroupedTableProps) {
    type GroupMove = { type: "group"; groupId: number; position: number };

    type LinkMove = {
        type: "link";
        linkId: number;
        groupId: number;
        positionInGroup: number;
    };

    type SwapReturnType = GroupMove | LinkMove | null;

    const groupIdToPosMap = createMemo(() => {
        const records = new Map<number, number>();

        props.linkGroups.forEach((group, index) =>
            records.set(group.id, index),
        );

        return records;
    });

    const links = createMemo(() =>
        props.linkGroups.flatMap((group) =>
            group.links.map((link) => ({ ...link, groupId: group.id })),
        ),
    );

    function swap(
        draggableId: number,
        droppableId: number | undefined,
    ): SwapReturnType {
        const draggableIsGroup = isGroup(draggableId);
        const droppableIsGroup = isGroup(droppableId);

        if (draggableIsGroup && droppableIsGroup) {
            return swapGroup();
        }

        if (droppableId == null) {
            return null;
        }

        if (!draggableIsGroup && droppableIsGroup) {
            return moveLinkToGroup(draggableId, droppableId);
        } else {
            return swapLink(draggableId, droppableId);
        }

        function isGroup(id: number | undefined): boolean {
            if (id == undefined) {
                return true;
            }

            return groupIdToPosMap().has(id);
        }

        function swapGroup(): GroupMove | null {
            const draggablePos = groupIdToPosMap().get(draggableId);
            const droppablePos =
                droppableId != undefined
                    ? groupIdToPosMap().get(droppableId)
                    : undefined;

            if (draggablePos == undefined) return null;

            const groups = props.linkGroups.map((group) => ({ ...group }));

            const draggable = groups.splice(draggablePos, 1)[0];

            let swapPos;

            if (droppablePos == undefined) {
                swapPos = groups.length - 1;
            } else {
                const offset = draggablePos >= droppablePos ? 0 : 1;
                swapPos = droppablePos - offset;
            }

            groups.splice(swapPos, 0, draggable);

            props.setLinkGroups(reconcile(groups));

            return {
                type: "group",
                groupId: draggableId,
                position: swapPos,
            };
        }

        function moveLinkToGroup(
            draggableId: number,
            droppableId: number,
        ): LinkMove | null {
            const groups = props.linkGroups.map((group) => ({
                ...group,
                links: [...group.links],
            }));

            const link = links().find((link) => link.id === draggableId);
            const fromGroup = groups.find(
                (group) => group.id === link?.groupId,
            );

            const toGroup = groups.find((group) => group.id === droppableId);

            if (
                link == undefined ||
                fromGroup == undefined ||
                toGroup == undefined
            )
                return null;

            const draggablePos = groupIdToPosMap().get(fromGroup.id);
            const droppablePos = groupIdToPosMap().get(droppableId);

            if (draggablePos == undefined || droppablePos == undefined)
                return null;

            fromGroup.links.splice(
                fromGroup.links.findIndex((l) => l.id === link.id),
                1,
            );
            toGroup.links.splice(0, 0, link);

            props.setLinkGroups(reconcile(groups));

            return {
                type: "link",
                groupId: toGroup.id,
                linkId: link.id,
                positionInGroup: 0,
            };
        }

        function swapLink(
            draggableId: number,
            droppableId: number,
        ): LinkMove | null {
            const groups = props.linkGroups.map((group) => ({
                ...group,
                links: [...group.links],
            }));

            const draggableLink = links().find(
                (link) => link.id === draggableId,
            );
            const droppableLink = links().find(
                (link) => link.id === droppableId,
            );

            const draggableGroup = groups.find(
                (group) => group.id === draggableLink?.groupId,
            );
            const droppableGroup = groups.find(
                (group) => group.id === droppableLink?.groupId,
            );

            const draggablePos = draggableGroup?.links.findIndex(
                (link) => link.id === draggableId,
            );
            const droppablePos = droppableGroup?.links.findIndex(
                (link) => link.id === droppableId,
            );

            if (
                draggableGroup == undefined ||
                draggablePos == undefined ||
                droppableGroup == undefined ||
                droppablePos == undefined
            )
                return null;

            if (draggableGroup != droppableGroup) {
                moveLinkToGroup(draggableId, droppableGroup.id);
                return swapLink(draggableId, droppableId);
            }

            const group = draggableGroup;

            const draggable = group.links.splice(draggablePos, 1)[0];

            const dropPosition = droppablePos;

            group.links.splice(dropPosition, 0, draggable);

            props.setLinkGroups(reconcile(groups));

            return {
                type: "link",
                groupId: group.id,
                linkId: draggableId,
                positionInGroup: dropPosition,
            };
        }
    }

    const [lastSwapResult, setLastSwapResult] =
        createSignal<SwapReturnType | null>(null);

    function onDragEnter(draggableId: number, droppableId: number | undefined) {
        setLastSwapResult(swap(draggableId, droppableId));
    }

    function onDragEnd() {
        const result = lastSwapResult();

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

    return { onDragEnter, onDragEnd } as const;
}

function GroupedTableItem(props: {
    virtualItem: VirtualItem<Element>;
    linkGroup: LinkGroup | undefined;
}) {
    let item!: HTMLLIElement;

    const { showModal, AddLinkDialog } = createAddLinkDialog();

    const { sortable, beingDragged } = createSortable(
        () => props.linkGroup?.id,
        () => ({ type: "group", groupNum: props.virtualItem.index }),
    )!;

    onMount(() => {
        sortable(item);
    });

    return (
        <li
            class="w-full px-4 py-2"
            ref={item}
            data-index={props.virtualItem.index}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translateY(${props.virtualItem.start ?? 0}px)`,
                opacity: beingDragged() ? 0.5 : 1,
            }}
        >
            <div class="min-h-fit rounded border">
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

function GroupedTableItemOverlay(props: {
    groupNum: number;
    linkGroup: LinkGroup;
}) {
    return (
        <li class="w-full select-none px-4 py-2">
            <div class="min-h-fit rounded border">
                <div class="flex border-b border-gray-600 p-3">
                    <span class="flex flex-1 items-center">
                        Group: {props.linkGroup.id}
                    </span>

                    <div class="flex gap-3">
                        <Button color="blue" rounded>
                            Add Link
                        </Button>

                        <Button color="red" rounded>
                            Del
                        </Button>
                    </div>
                </div>
                <ul>
                    <For each={props.linkGroup.links}>
                        {(link) => (
                            <GroupedTableItemLinkOverlay
                                partialBorder={true}
                                link={link}
                            />
                        )}
                    </For>
                </ul>
            </div>
        </li>
    );
}

function GroupedTableItemLink(props: { link: Link }) {
    const { showModal, TagAssignDialog } = createTagAssignDialog();

    const { sortable, beingDragged } = createSortable(
        () => props.link.id,
        () => ({ type: "link" }),
    )!;

    return (
        <>
            <li
                class="flex overflow-hidden border-b border-gray-600 last-of-type:border-b-0"
                style={{ opacity: beingDragged() ? 0.5 : 1 }}
                ref={sortable}
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

function GroupedTableItemLinkOverlay(props: {
    link: Link;
    partialBorder?: boolean;
}) {
    return (
        <li
            class={
                "flex select-none border-gray-600 " +
                (props.partialBorder ? "border-b" : "border")
            }
        >
            <div class="flex min-w-0 flex-1 flex-shrink-0 items-center overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-600 p-3">
                {props.link.title}
            </div>
            <div class="flex items-center justify-center gap-3 p-3">
                <a
                    class="rounded bg-blue-600 p-3 py-1 hover:bg-blue-400"
                    href={props.link.uri}
                >
                    Open
                </a>

                <Button color="blue" rounded>
                    Assign Tags
                </Button>

                <Button color="red" rounded>
                    Del
                </Button>
            </div>
        </li>
    );
}
