import { createAsync } from "@solidjs/router";
import {
    Index,
    Ref,
    Show,
    createEffect,
    createSelector,
    createSignal,
} from "solid-js";
import { removeLink } from "@/api/actions";
import { getDupes } from "@/api/fetchers";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import { ResolveDupeItem } from "@/types";

export function ResolveDupesData() {
    getDupes();
}

export default function ResolveDupes() {
    const result = createAsync(() => getDupes());

    const fallbackResult = {
        dupes_left: 0,
        groups: [],
        key: "",
    };

    return <ResolveDupeTable result={result() ?? fallbackResult} />;
}

function ResolveDupeTable(props: { result?: ResolveDupeItem }) {
    let scrollElement!: HTMLDivElement;

    const [lastKey, setLastKey] = createSignal("");

    createEffect(() => {
        if (scrollElement && lastKey() !== props.result?.key) {
            scrollElement.scrollTop = 0;
        }

        setLastKey(props.result?.key ?? "");
    });

    return (
        <Show when={props.result} fallback={<LoadingIndicator />}>
            {(result) => (
                <Show
                    when={result().groups.length > 0}
                    fallback={
                        <div>
                            <div class="p-3">No dupes detected</div>
                        </div>
                    }
                >
                    <DupeList ref={scrollElement} result={result()} />
                </Show>
            )}
        </Show>
    );
}

function DupeList(props: {
    ref: Ref<HTMLDivElement>;
    result: ResolveDupeItem;
}) {
    const isDuplicatedKey = createSelector(() => props.result.key);

    async function removeLinkById(id: number) {
        removeLink(id);
    }

    return (
        <div class="relative h-full overflow-auto" ref={props.ref}>
            <Progress result={props.result} />

            <ul class="flex flex-col gap-4 border-0">
                <Index each={props.result.groups}>
                    {(g) => (
                        <li class="mx-4 rounded border">
                            <ul>
                                <Index each={g().links}>
                                    {(d) => (
                                        <li
                                            class="flex border-b border-gray-600 last-of-type:border-b-0"
                                            classList={{
                                                "bg-red-500": isDuplicatedKey(
                                                    d().uri,
                                                ),
                                            }}
                                        >
                                            <div class="flex-1 border-r border-gray-600 p-3">
                                                {d().title}
                                            </div>
                                            <div class="flex-1 border-r border-gray-600 p-3">
                                                <a
                                                    class="break-words break-all"
                                                    href={d().uri}
                                                    target="_blank"
                                                >
                                                    {d().uri}
                                                </a>
                                            </div>
                                            <div class="flex w-20 items-center justify-center px-3 py-1">
                                                <Show
                                                    when={
                                                        d().uri ==
                                                        props.result.key
                                                    }
                                                >
                                                    <Button
                                                        onClick={() =>
                                                            removeLinkById(
                                                                d().id,
                                                            )
                                                        }
                                                        color="red"
                                                        rounded
                                                    >
                                                        Del
                                                    </Button>
                                                </Show>
                                            </div>
                                        </li>
                                    )}
                                </Index>
                            </ul>
                        </li>
                    )}
                </Index>
            </ul>
        </div>
    );
}

function Progress(props: { result: ResolveDupeItem }) {
    return (
        <h1 class="sticky left-0 right-0 top-0 mx-4 bg-gray-900 text-white">
            {props.result.key} (
            {`${props.result.groups.length - 1} - 
                ${props.result.dupes_left} left`}
            )
        </h1>
    );
}
