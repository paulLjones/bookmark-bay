import { Show, createEffect, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { addGroup, removeEmptyGroups } from "@/api/actions";
import { getLinkGroups } from "@/api/fetchers";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import { LinkGroup } from "@/types";
import GroupedTable from "./Table";

export function GroupedData() {
    getLinkGroups();
}

export default function Grouped() {
    const [initialised, setInitialised] = createSignal(false);
    const [linkGroups, setLinkGroups] = createStore<LinkGroup[]>([]);

    createEffect(() => {
        getLinkGroups().then((groups) => {
            setLinkGroups(reconcile(groups));
            setInitialised(true);
        });
    });

    return (
        <Show when={initialised()} fallback={<LoadingIndicator />}>
            <div class="flex justify-between bg-neutral-950 p-3">
                <Button onClick={removeEmptyGroups} color="darkYellow" rounded>
                    Remove Empty Groups
                </Button>

                <Button onClick={addGroup} color="blue" rounded>
                    Add Group
                </Button>
            </div>

            <GroupedTable
                linkGroups={linkGroups}
                setLinkGroups={setLinkGroups}
            />
        </Show>
    );
}
