import { JSXElement } from "solid-js";

function Dialog(props: {
    ref: HTMLDialogElement | undefined;
    title: string;
    class?: string;
    children: JSXElement;
}) {
    return (
        <dialog
            ref={props.ref}
            class={`h-fit w-fit rounded-lg border bg-gray-800 text-white backdrop:bg-black backdrop:opacity-50 ${props.class}`}
            onClick={(e) =>
                e.target == e.currentTarget ? e.currentTarget.close() : null
            }
        >
            <div class="flex max-h-fit min-h-full w-full flex-col">
                <div class="flex items-center justify-between bg-gray-600 ps-4">
                    <p> {props.title} </p>

                    <form method="dialog">
                        <button class="flex h-8 w-8 items-center justify-center bg-red-600 hover:bg-red-400">
                            X
                        </button>
                    </form>
                </div>

                <div class="flex min-h-fit shrink grow flex-col overflow-clip">
                    {props.children}
                </div>
            </div>
        </dialog>
    );
}

export default function createDialog() {
    let dialog!: HTMLDialogElement;

    function showModal() {
        dialog.showModal();
    }

    return {
        ref: () => dialog,
        showModal,
        Dialog: (props: {
            title: string;
            class?: string;
            children: JSXElement;
        }) => (
            <Dialog ref={dialog} title={props.title} class={props.class}>
                {props.children}
            </Dialog>
        ),
    };
}
