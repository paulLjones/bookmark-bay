import { revalidate } from "@solidjs/router";
import { batch, createSignal, onCleanup, onMount } from "solid-js";
import { addLink } from "@/api/actions";
import { CacheKeys } from "@/api/fetchers";
import { LinkGroup } from "@/types";
import Button from "./Button";
import createDialog from "./Dialog";
import { message } from "@tauri-apps/api/dialog";

function AddLinkDialog(props: {
    dialogRef: HTMLDialogElement | undefined;
    linkGroup: LinkGroup;
}) {
    const [url, setUrl] = createSignal("");
    const [title, setTitle] = createSignal("");
    const [triedSubmitting, setTriedSubmitting] = createSignal(false);

    function validateTitle(): boolean {
        const currentTitle = title();

        if (!currentTitle) {
            message("Please provide input for all fields", {
                title: "Validation Error",
                type: "error",
            });
            return false;
        }

        return true;
    }

    function validateUrl(): boolean {
        const currentUrl = url();

        if (!currentUrl) {
            message("Please provide input for all fields", {
                title: "Validation Error",
                type: "error",
            });
            return false;
        }

        try {
            new URL(currentUrl);
        } catch (_) {
            message(
                "Please input a valid URL including the protocol (http:// or https://)",
                {
                    title: "Validation Error",
                    type: "error",
                },
            );
            return false;
        }

        return true;
    }

    function addLinkToGroup() {
        const currentUrl = url();
        const currentTitle = title();

        setTriedSubmitting(true);

        batch(() => {
            if (validateUrl() && validateTitle()) {
                addLink(props.linkGroup.id, currentUrl, currentTitle);
                props.dialogRef?.close();
            }
        });
    }

    function cancelHandler() {
        setUrl("");
        setTitle("");
        setTriedSubmitting(false);
        revalidate([CacheKeys.LINKS, CacheKeys.LINK_GROUPS]);
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
        <div class="flex max-h-full shrink grow flex-col gap-5 p-5">
            <div class="relative flex flex-col">
                <input
                    type="url"
                    class="w-full flex-grow rounded p-2 text-black outline transition-all valid:outline-green-500 invalid:outline-red-600"
                    classList={{
                        "invalid:placeholder-shown:outline-transparent":
                            !triedSubmitting(),
                    }}
                    placeholder={"URL"}
                    value={url() ?? ""}
                    onInput={(e) => setUrl(e.currentTarget.value)}
                    required
                />
            </div>

            <div class="relative flex flex-col">
                <input
                    type="text"
                    class="w-full flex-grow rounded p-2 text-black outline transition-all valid:outline-green-500 invalid:outline-red-600"
                    classList={{
                        "invalid:placeholder-shown:outline-transparent":
                            !triedSubmitting(),
                    }}
                    placeholder={"Title"}
                    value={title() ?? ""}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                    required
                />
            </div>

            <div class="flex justify-center gap-3">
                <Button onClick={addLinkToGroup} color="blue" rounded>
                    Create
                </Button>

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

export default function createAddLinkDialog() {
    const { ref, showModal, Dialog } = createDialog();

    return {
        showModal,
        AddLinkDialog: (props: { linkGroup: LinkGroup }) => (
            <Dialog title="Add Link" class="max-w-screen max-h-screen">
                <AddLinkDialog linkGroup={props.linkGroup} dialogRef={ref()} />
            </Dialog>
        ),
    };
}
