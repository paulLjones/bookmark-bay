import { createSignal, onCleanup, onMount, Suspense } from "solid-js";
import Button from "./Button";
import createDialog from "./Dialog";

export type DupeResolveStrategy = "KeepAll" | "KeepExisting";

export type InsertPosition = "Before" | "After";

export type ImportConfigDialogSubmission = {
    strategy: DupeResolveStrategy;
    position: InsertPosition;
};

function ImportConfigDialog(props: {
    dialogRef: HTMLDialogElement | undefined;
    onSubmit: (submission: ImportConfigDialogSubmission) => unknown;
}) {
    const [dupeResolveStrategy, setDupeResolveStrategy] =
        createSignal<DupeResolveStrategy>("KeepAll");

    const [insertPosition, setInsertPosition] =
        createSignal<InsertPosition>("Before");

    function onSubmit() {
        const strategy = dupeResolveStrategy();
        const position = insertPosition();

        if (!(strategy || position)) return;

        props.onSubmit({ strategy, position });
    }

    function cancelHandler() {
        setDupeResolveStrategy("KeepAll");
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
        <Suspense>
            <div class="flex overflow-hidden p-5">
                <div class="flex flex-col justify-center gap-5 overflow-hidden">
                    <div class="w-full flex-1 overflow-auto">
                        <form class="flex flex-col gap-4" method="dialog">
                            <div class="flex justify-between gap-8">
                                <label for="import-config-dialog--dupe-resolver">
                                    How do you want to handle duplicates?
                                </label>

                                <select
                                    id="import-config-dialog--dupe-resolver"
                                    class="text-black"
                                    value={dupeResolveStrategy() ?? "KeepAll"}
                                    onInput={(event) =>
                                        setDupeResolveStrategy(
                                            event.target
                                                .value as DupeResolveStrategy,
                                        )
                                    }
                                >
                                    <option value="KeepAll">Keep All</option>
                                    <option value="KeepExisting">
                                        Keep Existing
                                    </option>
                                </select>
                            </div>

                            <div class="flex justify-between gap-8">
                                <label for="import-config-dialog--insert-before">
                                    Where do you want to insert new links?
                                </label>

                                <select
                                    id="import-config-dialog--insert-before"
                                    class="text-black"
                                    value={insertPosition() ?? "Before"}
                                    onInput={(event) =>
                                        setInsertPosition(
                                            event.target
                                                .value as InsertPosition,
                                        )
                                    }
                                >
                                    <option value="Before">Before</option>
                                    <option value="After">After</option>
                                </select>
                            </div>

                            <div class="mt-auto flex justify-between">
                                <Button onClick={onSubmit} color="blue" rounded>
                                    Submit
                                </Button>

                                <Button
                                    onClick={() => props.dialogRef?.close()}
                                    color="red"
                                    rounded
                                >
                                    Close
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default function createImportConfigDialog() {
    const { ref, showModal, Dialog } = createDialog();

    let resolve: (
        value:
            | ImportConfigDialogSubmission
            | PromiseLike<ImportConfigDialogSubmission>,
    ) => void;

    function onSubmit(args: ImportConfigDialogSubmission) {
        resolve(args);
    }

    async function promptUser(): Promise<ImportConfigDialogSubmission> {
        const promise = new Promise<ImportConfigDialogSubmission>((res) => {
            resolve = res;
        });

        showModal();

        return await promise;
    }

    return {
        promptUser,
        ImportConfigDialog: (props: object) => (
            <Dialog title="Import" class="max-w-screen max-h-screen">
                <ImportConfigDialog
                    {...props}
                    dialogRef={ref()}
                    onSubmit={onSubmit}
                />
            </Dialog>
        ),
    };
}
