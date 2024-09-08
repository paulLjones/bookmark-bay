import { For, Show } from "solid-js";
import Button from "./Button";

export default function SearchBar(props: {
    searchText: string | undefined;
    setSearchText: (value: string) => void;

    tags?: string[];
    currentTag?: string | undefined;
    setCurrentTag?: (value: string | null) => void;

    buttonLabel?: string;
    onButtonPress?: VoidFunction;
}) {
    return (
        <div class="flex justify-between bg-neutral-950 p-3">
            <div class="relative flex">
                <input
                    type="search"
                    class="w-full flex-grow rounded p-2 text-black transition-all"
                    placeholder={"Search title..."}
                    value={props.searchText ?? ""}
                    onClick={(e) => e.stopPropagation()}
                    onInput={(e) =>
                        props.setSearchText?.(e.currentTarget.value)
                    }
                />
                <button
                    class="absolute right-0 h-full rounded-e bg-red-600 p-2 px-4 transition-all hover:bg-red-400"
                    onClick={(e) => {
                        e.stopPropagation();

                        props.setSearchText?.("");
                    }}
                >
                    C
                </button>
            </div>

            <Show when={props.tags && props.tags.length}>
                <select
                    class="text-black"
                    onChange={(e) =>
                        props.setCurrentTag?.(
                            e.currentTarget.value.length
                                ? e.currentTarget.value
                                : null,
                        )
                    }
                >
                    <option selected={props.currentTag == null} value={""}>
                        All
                    </option>
                    <For each={props.tags}>
                        {(tag) => (
                            <option selected={props.currentTag == tag}>
                                {tag}
                            </option>
                        )}
                    </For>
                </select>
            </Show>

            <Show when={props.buttonLabel && props.onButtonPress}>
                <Button
                    color="blue"
                    onClick={() => props.onButtonPress?.()}
                    rounded
                >
                    {props.buttonLabel}
                </Button>
            </Show>
        </div>
    );
}
