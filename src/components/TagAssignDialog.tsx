import { A, revalidate } from "@solidjs/router";
import {
    For,
    Match,
    Show,
    Suspense,
    Switch,
    createResource,
    createSignal,
    onCleanup,
    onMount,
} from "solid-js";
import { toggleTagForLink } from "@/api/actions";
import { CacheKeys, getTags, getTagsForLink } from "@/api/fetchers";
import { Link } from "@/types";
import Button from "./Button";
import createDialog from "./Dialog";
import LoadingIndicator from "./LoadingIndicator";

function TagAssignTable(props: {
    dialogRef: HTMLDialogElement | undefined;
    data: Link;
}) {
    const [searchText, setSearchText] = createSignal("");

    const [tags] = createResource<string[]>(() => {
        return getTags();
    });

    const [activeTags, { refetch }] = createResource<string[], number>(
        () => props.data?.id,
        (id) => getTagsForLink(id),
    );

    async function toggleTag(tag: string) {
        await toggleTagForLink(tag, props.data.uri);
        await refetch();
    }

    const filteredTags = () =>
        tags()?.filter((tag) =>
            searchText()
                ? tag.toLowerCase().includes(searchText().toLowerCase())
                : true,
        );

    function cancelHandler() {
        setSearchText("");
        revalidate([CacheKeys.LINKS]);
    }

    onMount(() => {
        props.dialogRef?.addEventListener("close", cancelHandler);
        props.dialogRef?.addEventListener("cancel", cancelHandler);
    });

    onCleanup(() => {
        props.dialogRef?.removeEventListener("close", cancelHandler);
        props.dialogRef?.removeEventListener("cancel", cancelHandler);
    });

    return (
        <div class="flex max-h-full shrink grow flex-col gap-5 overflow-clip p-5">
            <div class="relative flex">
                <input
                    type="search"
                    class="w-full flex-grow rounded p-2 text-black transition-all"
                    placeholder={"Search tag..."}
                    value={searchText() ?? ""}
                    onInput={(e) => setSearchText(e.currentTarget.value)}
                />
                <button
                    class="absolute right-0 h-full rounded-e bg-red-600 p-2 px-4 transition-all hover:bg-red-400"
                    onClick={(e) => {
                        e.stopPropagation();

                        setSearchText("");
                    }}
                >
                    C
                </button>
            </div>

            <div
                class={`max-h-[calc(100lvh_-_20rem)] min-h-20 shrink grow overflow-auto ps-[0.16px] pt-[0.16px]`}
            >
                <Suspense
                    fallback={
                        <div class="mx-auto h-40 w-40">
                            <LoadingIndicator />
                        </div>
                    }
                >
                    <table class="w-full">
                        <thead>
                            <tr class="sticky -top-px border border-gray-600 bg-slate-800">
                                <th class="border border-gray-600">Tag</th>
                                <th class="border-gray-600">Assign/Unassign</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Show
                                when={filteredTags()?.length}
                                fallback={
                                    <tr>
                                        <Switch>
                                            <Match when={searchText()}>
                                                <td
                                                    class="border border-gray-600"
                                                    colSpan={2}
                                                >
                                                    No tags matching your search
                                                    were found
                                                </td>
                                            </Match>

                                            <Match when={!searchText()}>
                                                <td class="border border-gray-600">
                                                    No tags have been defined
                                                </td>
                                                <td class="border border-gray-600">
                                                    <A
                                                        href="/tags"
                                                        class="m-2 block rounded bg-blue-500 py-1 text-center hover:bg-blue-400"
                                                    >
                                                        Create Tags
                                                    </A>
                                                </td>
                                            </Match>
                                        </Switch>
                                    </tr>
                                }
                            >
                                <For each={filteredTags()}>
                                    {(tag) => (
                                        <tr>
                                            <td class="border border-gray-600">
                                                {tag}
                                            </td>
                                            <td class="border border-gray-600">
                                                <Show
                                                    when={activeTags()?.includes(
                                                        tag,
                                                    )}
                                                    fallback={
                                                        <Button
                                                            onClick={() =>
                                                                toggleTag(tag)
                                                            }
                                                            color="green"
                                                            class="w-full"
                                                        >
                                                            +
                                                        </Button>
                                                    }
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            toggleTag(tag)
                                                        }
                                                        color="red"
                                                        class="w-full"
                                                    >
                                                        -
                                                    </Button>
                                                </Show>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                        </tbody>
                    </table>
                </Suspense>
            </div>

            <div class="flex justify-center">
                <Button
                    onClick={() => props.dialogRef?.close()}
                    color="red"
                    rounded
                >
                    Close
                </Button>
            </div>
        </div>
    );
}

export default function createTagAssignDialog() {
    const { ref, showModal, Dialog } = createDialog();

    return {
        showModal,
        TagAssignDialog: (props: { data: Link }) => (
            <Dialog title="Assign Tags" class="max-w-screen max-h-screen">
                <TagAssignTable data={props.data} dialogRef={ref()} />
            </Dialog>
        ),
    };
}
