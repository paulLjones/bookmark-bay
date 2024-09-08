import {
    VirtualItem,
    Virtualizer,
    createVirtualizer,
} from "@tanstack/solid-virtual";
import { For, Match, Show, Switch, createSignal } from "solid-js";
import { addTag, removeTag } from "@/api/actions";
import Button from "@/components/Button";
import createDialog from "@/components/Dialog";
import getLinkHeight from "@/utils/getLinkHeight";

type SortData = {
    order: "asc" | "desc";
};

const ROW_HEIGHT = getLinkHeight() + 1;

export default function TagList(props: {
    data: string[];
    sortData: SortData;
    setSortData: (data: SortData) => void;
    Dialog: ReturnType<typeof createDialog>["Dialog"];
    isFiltered: boolean;
}) {
    let scrollElement: HTMLDivElement | undefined;

    const virtualizer = createVirtualizer({
        get count() {
            return props.data.length;
        },
        getScrollElement: () => scrollElement as Element | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        estimateSize: (_i: number) => ROW_HEIGHT,
    });

    return (
        <div
            class="relative h-full w-full overflow-auto"
            ref={scrollElement}
            classList={{
                "px-4 py-2": props.data.length > 0,
            }}
        >
            <Show
                when={props.data.length}
                fallback={
                    <div>
                        <p class="p-3">
                            <Switch fallback="No tags are currently loaded">
                                <Match when={props.isFiltered}>
                                    No tags matching your search were found
                                </Match>
                            </Switch>
                        </p>
                    </div>
                }
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize() + ROW_HEIGHT}px`,
                        width: "100%",
                        position: "relative",
                        contain: "strict",
                    }}
                >
                    <table class="w-full border-separate border-spacing-0">
                        <thead class="">
                            <tr class="">
                                <th class="border border-gray-600">
                                    <button
                                        class="w-full py-3"
                                        onClick={() => {
                                            props.setSortData({
                                                order:
                                                    props.sortData.order ==
                                                    "asc"
                                                        ? "desc"
                                                        : "asc",
                                            });
                                        }}
                                    >
                                        Name{" "}
                                        {`(${props.sortData.order.toUpperCase()})`}
                                    </button>
                                </th>
                                <th class="border-b border-r border-t border-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="w-full">
                            <For each={virtualizer.getVirtualItems()}>
                                {(virtualItem, index) => (
                                    <TagListItem
                                        index={index()}
                                        virtualizer={virtualizer}
                                        virtualItem={virtualItem}
                                        data={props.data[virtualItem.index]}
                                    />
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Show>

            <CreateTag Dialog={props.Dialog} />
        </div>
    );
}

function TagListItem(props: {
    index: number;
    virtualizer: Virtualizer<Element, Element>;
    virtualItem: VirtualItem<Element>;
    data: string;
}) {
    let row: HTMLTableRowElement | undefined;

    return (
        <tr
            class="w-full"
            ref={row}
            data-index={props.virtualItem.index}
            style={{
                transform: `translateY(${
                    props.virtualItem.start -
                    props.index * props.virtualItem.size
                }px)`,
            }}
        >
            <td class="border-b border-l border-r border-gray-600 p-3">
                {props.data}
            </td>
            <td class="w-2/12 border-b border-r border-gray-600 p-3">
                <div class="flex items-center gap-3">
                    <Button
                        color="red"
                        rounded
                        onClick={() => {
                            removeTag(props.data);
                        }}
                    >
                        Del
                    </Button>
                </div>
            </td>
        </tr>
    );
}

function CreateTag(props: {
    Dialog: ReturnType<typeof createDialog>["Dialog"];
}) {
    const [content, setContent] = createSignal("");
    const [triedSubmitting, setTriedSubmitting] = createSignal(false);

    async function onSubmit(event: SubmitEvent) {
        setTriedSubmitting(true);

        if (content()) {
            await addTag(content());
            setContent("");
            setTriedSubmitting(false);
        } else {
            event.preventDefault();
        }
    }

    return (
        <>
            <props.Dialog title="Add new tag">
                <form
                    method="dialog"
                    onSubmit={onSubmit}
                    class="flex flex-col gap-4 p-4"
                    novalidate
                >
                    <div class="flex flex-col">
                        <label for="tagName">Tag Name</label>

                        <input
                            class="rounded p-1 text-black"
                            classList={{
                                "outline invalid:outline-red-600":
                                    triedSubmitting(),
                            }}
                            type="text"
                            id="tagName"
                            autofocus
                            value={content()}
                            onInput={(ev) => setContent(ev.target.value)}
                            required
                        />
                    </div>

                    <Button color="blue" rounded>
                        Submit
                    </Button>
                </form>
            </props.Dialog>
        </>
    );
}
