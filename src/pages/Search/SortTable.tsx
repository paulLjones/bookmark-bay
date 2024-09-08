import { revalidate } from "@solidjs/router";
import {
    VirtualItem,
    Virtualizer,
    VirtualizerOptions,
    createVirtualizer,
} from "@tanstack/solid-virtual";
import { For, Show, createEffect, createMemo, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { removeLink } from "@/api/actions";
import { CacheKeys } from "@/api/fetchers";
import Button from "@/components/Button";
import createTagAssignDialog from "@/components/TagAssignDialog";
import type { Link, SortData } from "@/types";
import getLinkHeight from "@/utils/getLinkHeight";

const ROW_HEIGHT = getLinkHeight() + 1;

export default function SortTable(props: {
    data: Link[];
    sortData: SortData;
    setSortData: (data: SortData) => void;
}) {
    const refetch = () => revalidate(CacheKeys.LINKS);

    let scrollElement!: HTMLDivElement;

    const virtualizerConfig = createMemo(() => {
        return {
            count: props.data.length,
            getScrollElement: () => scrollElement as Element | null,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            estimateSize: (_i: number) => ROW_HEIGHT,
            getItemKey: (index: number) => props.data[index]?.id,
        } as VirtualizerOptions<Element, Element>;
    });

    //@ts-expect-error Tanstack type definitions aren't correct here
    const virtualizer = createVirtualizer(() => virtualizerConfig());

    createEffect(() => {
        console.log(virtualizer.getVirtualItems().map((item) => item));
    });

    return (
        <div class="h-full w-full overflow-auto px-4 py-2" ref={scrollElement}>
            <div
                class="overflow-hidden"
                style={{
                    height: `${virtualizer.getTotalSize() + ROW_HEIGHT}px`,
                }}
            >
                <table
                    class="w-full overflow-hidden border border-gray-600"
                    style={{
                        transform: `translateY(${virtualizer.getVirtualItems()?.[0]?.start ?? 0}px)`,
                    }}
                >
                    <thead class="">
                        <tr>
                            <td class="border border-gray-600 p-px">
                                <button
                                    class="w-full py-3 font-bold"
                                    onClick={() => {
                                        props.setSortData({
                                            column: "title",
                                            order:
                                                props.sortData.order == "asc"
                                                    ? "desc"
                                                    : "asc",
                                        });
                                    }}
                                >
                                    Title
                                    <Show
                                        when={props.sortData.column == "title"}
                                    >
                                        {" "}
                                        {`(${props.sortData.order.toUpperCase()})`}
                                    </Show>
                                </button>
                            </td>
                            <td class="max-w-fit whitespace-nowrap border border-gray-600 text-center font-bold">
                                Actions
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={virtualizer.getVirtualItems()}>
                            {(virtualItem) => (
                                <SortTableItem
                                    virtualizer={virtualizer}
                                    virtualItem={virtualItem}
                                    data={props.data[virtualItem.index]}
                                    refetch={refetch}
                                />
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SortTableItem(props: {
    virtualizer: Virtualizer<Element, Element>;
    virtualItem: VirtualItem<Element>;
    data: Link;
    refetch: VoidFunction;
}) {
    let item!: HTMLTableRowElement;

    const { showModal, TagAssignDialog } = createTagAssignDialog();

    const measureEl = () => {
        if (item) props.virtualizer.measureElement(item);
    };

    onMount(() => {
        measureEl();
    });

    return (
        <>
            <tr ref={item} data-index={props.virtualItem.index}>
                <td class="items-center overflow-hidden border border-gray-600 p-3">
                    <div class="text-ellipsis ">{props.data.title}</div>
                </td>
                <td
                    class="max-w-fit border border-gray-600 p-3 text-center"
                    style={{
                        width: "1%",
                    }}
                >
                    <div class="flex items-center justify-center gap-3">
                        <a
                            href={props.data.uri}
                            target="_blank"
                            class="w-full whitespace-nowrap rounded bg-blue-600 px-3 py-2 hover:bg-blue-400 lg:w-fit"
                        >
                            Open
                        </a>

                        <Button
                            color="blue"
                            class="whitespace-nowrap text-nowrap"
                            onClick={() => showModal()}
                            rounded
                        >
                            Assign Tags
                        </Button>

                        <Button
                            color="red"
                            class="whitespace-nowrap text-nowrap"
                            onClick={() => {
                                removeLink(props.data.id).then(props.refetch);
                            }}
                            rounded
                        >
                            Del
                        </Button>
                    </div>
                </td>
            </tr>
            <Portal mount={document.body}>
                <TagAssignDialog data={props.data} />
            </Portal>
        </>
    );
}
