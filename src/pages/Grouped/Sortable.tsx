import {
    Accessor,
    JSX,
    JSXElement,
    ParentProps,
    batch,
    createContext,
    createSignal,
    onCleanup,
    onMount,
    useContext,
} from "solid-js";
import {
    SetStoreFunction,
    Store,
    createStore,
    reconcile,
} from "solid-js/store";
import { addEventListener } from "solid-js/web";

/**
 * Code for left mouse button or main pointer device
 */
const BUTTON_PRIMARY = 0;

type DraggedItemData = { groupNum?: number; type?: string };

type ActiveDraggables = {
    el: Accessor<HTMLElement>;
    id: Accessor<number | undefined>;
    type: Accessor<string>;
}[];

type DragEventHandler = (
    draggable: number,
    droppable: number | undefined,
) => void;

type Position = { x: number; y: number };

type SortableContextData = {
    draggedItemId: number | null;
    draggedItemData: DraggedItemData;
    draggedItemRect: DOMRect | null;
    containerElement: Accessor<HTMLElement>;
    dragOffset: Position | null;
    originalRefOffset: Position | null;
    overlayTransform: JSX.CSSProperties;
    activeDraggables: ActiveDraggables;
    onDragEnter?: DragEventHandler;
    onDragEnd?: VoidFunction;
    onAutoscrollerMove: ReturnType<
        typeof createAutoScroller
    >["onAutoscrollerMove"];
};

type SortableContextType = [
    Store<SortableContextData>,
    SetStoreFunction<SortableContextData>,
];

const SortableContext = createContext<SortableContextType>();

type SortableProviderProps = ParentProps & {
    onDragEnter?: DragEventHandler;
    onDragEnd?: VoidFunction;
    containerElement: Accessor<HTMLElement>;
};

export function SortableProvider(props: SortableProviderProps) {
    const containerElement = () => props.containerElement();
    const { onAutoscrollerMove, cancelAutoscroller } =
        createAutoScroller(containerElement);

    const [store, setStore] = createStore<SortableContextData>({
        activeDraggables: [] as ActiveDraggables,
        draggedItemId: null,
        draggedItemData: {},
        draggedItemRect: null,
        containerElement,
        dragOffset: null,
        originalRefOffset: null,
        overlayTransform: {},
        onDragEnter: (draggable, droppable) =>
            props.onDragEnter?.(draggable, droppable),
        onDragEnd: () => {
            cancelAutoscroller();
            props.onDragEnd?.();
        },
        onAutoscrollerMove,
    });

    return (
        <SortableContext.Provider value={[store, setStore]}>
            {props.children}
        </SortableContext.Provider>
    );
}

export function useSortableContext() {
    const sortableContext = useContext(SortableContext);

    return sortableContext;
}

export function SortableOverlay(props: {
    children: (props: {
        id: number | null;
        data: DraggedItemData;
    }) => JSXElement;
}) {
    const [sortableContext] = useSortableContext()!;

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                ...sortableContext.overlayTransform,
            }}
        >
            {props.children({
                id: sortableContext.draggedItemId,
                data: sortableContext.draggedItemData,
            })}
        </div>
    );
}

export function createSortable(
    id: Accessor<number | undefined>,
    data: Accessor<DraggedItemData> = () => ({}),
) {
    const [sortableContext] = useSortableContext()!;

    const sortable = createSortableHook(id, data);

    const beingDragged = () => sortableContext.draggedItemId == id();

    return { sortable, beingDragged };
}

function createSortableHook(
    id: Accessor<number | undefined>,
    data: Accessor<DraggedItemData>,
) {
    const [sortableContext, setSortableContext] = useSortableContext()!;

    return (ref: HTMLElement) => {
        if (!ref) return;

        onMount(() =>
            setSortableContext(
                "activeDraggables",
                reconcile([
                    ...sortableContext.activeDraggables,
                    { el: () => ref, id, type: () => data().type! },
                ]),
            ),
        );

        onCleanup(() => {
            setSortableContext(
                "activeDraggables",
                reconcile(
                    sortableContext.activeDraggables.filter(({ id: elId }) => {
                        return elId() != id();
                    }),
                ),
            );
        });

        function onPointerMove(event: PointerEvent) {
            event.preventDefault();

            sortableContext.onAutoscrollerMove(event);

            const overlayPos = overlayPosition(sortableContext, event);

            const parentRect = sortableContext
                .containerElement()
                .getBoundingClientRect();

            const closestEl = getClosestCollidingEl(
                {
                    x: overlayPos.x + parentRect.x,
                    y: overlayPos.y + parentRect.y,
                },
                sortableContext,
            );

            batch(() => {
                if (
                    closestEl?.id() != sortableContext.draggedItemId &&
                    sortableContext.onDragEnter
                ) {
                    sortableContext.onDragEnter(
                        sortableContext.draggedItemId!,
                        closestEl?.id(),
                    );
                }
            });

            setSortableContext({
                overlayTransform: {
                    transform: `translate(${overlayPos.x}px, ${overlayPos.y}px)`,
                },
            });
        }

        addEventListener(
            ref,
            "pointerdown",
            // @ts-expect-error Incorrect Type
            (
                event: PointerEvent & {
                    target: HTMLElement;
                    currentTarget: HTMLElement;
                },
            ) => {
                // Guard to prevent firing from wrong event
                if (
                    event.button !== BUTTON_PRIMARY ||
                    event.currentTarget.contains(event.target) === false ||
                    event.target instanceof HTMLButtonElement ||
                    event.target instanceof HTMLAnchorElement
                )
                    return;

                event.stopPropagation();
                event.preventDefault();

                const parentRect = sortableContext
                    .containerElement()
                    .getBoundingClientRect();
                const refRect = ref.getBoundingClientRect();

                // Offset of element from it's container
                const relativeRefPos = {
                    x: parentRect.left - refRect.left,
                    y: parentRect.top - refRect.top,
                };

                setSortableContext({
                    draggedItemId: id(),
                    draggedItemData: data(),
                    draggedItemRect: refRect,
                    originalRefOffset: {
                        x: parentRect.left,
                        y: parentRect.top,
                    },
                    dragOffset: {
                        x: event.clientX + relativeRefPos.x,
                        y: event.clientY + relativeRefPos.y,
                    },
                });

                // Initialize dragging state
                onPointerMove(event);

                document.addEventListener("pointermove", onPointerMove);

                // Cleanup event
                document.addEventListener(
                    "pointerup",
                    () => {
                        document.removeEventListener(
                            "pointermove",
                            onPointerMove,
                        );
                        setSortableContext({
                            draggedItemId: null,
                            draggedItemData: {
                                groupNum: undefined,
                                type: undefined,
                            },
                            draggedItemRect: null,
                            dragOffset: null,
                            originalRefOffset: null,
                            overlayTransform: {},
                        });

                        sortableContext.onDragEnd?.();
                    },
                    { once: true },
                );
            },
            true,
        );
    };
}

function getClosestCollidingEl(
    pos: Position,
    sortableContext: SortableContextData,
) {
    const COLLISION_PADDING = 10;

    const draggedRect = sortableContext.draggedItemRect!;

    function isColliding({ rect }: { rect: DOMRect }) {
        const bottomOfDraggedRectIntersectingTargetTop =
            pos.y - COLLISION_PADDING + draggedRect.height >= rect.top &&
            pos.y - COLLISION_PADDING + draggedRect.height <= rect.bottom;

        const topOfDraggedRectIntersectingWithTargetBottom =
            pos.y + COLLISION_PADDING <= rect.bottom &&
            pos.y + COLLISION_PADDING >= rect.top;

        return (
            bottomOfDraggedRectIntersectingTargetTop ||
            topOfDraggedRectIntersectingWithTargetBottom
        );
    }

    let possibleTargets = sortableContext.activeDraggables.map(
        (draggable, index) => ({
            ...draggable,
            rect: draggable.el().getBoundingClientRect(),
            position: index,
        }),
    );

    if (sortableContext.draggedItemData.type === "group") {
        possibleTargets = possibleTargets.filter(
            (target) => target.type() == "group",
        );
    }

    const results = possibleTargets
        .filter(isColliding)
        .map((group) => {
            const center = pos.y + draggedRect.height / 2;
            const distToTop = Math.abs(group.rect.top - center);

            return {
                ...group,
                diff: Math.min(distToTop),
            };
        })
        .sort((a, b) => {
            return a.diff - b.diff;
        });

    return results.shift();
}

function overlayPosition(
    sortableContext: SortableContextData,
    event: PointerEvent,
) {
    const parentRect = sortableContext
        .containerElement()
        .getBoundingClientRect();

    const relativeRefOffset = {
        x: parentRect.left,
        y: parentRect.top,
    };

    const changeInOffset = {
        x: sortableContext.originalRefOffset!.x - relativeRefOffset.x,
        y: sortableContext.originalRefOffset!.y - relativeRefOffset.y,
    };

    return {
        x: event.clientX - sortableContext.dragOffset!.x + changeInOffset.x,
        y: event.clientY - sortableContext.dragOffset!.y + changeInOffset.y,
    };
}

function createAutoScroller(containerElement: Accessor<HTMLElement>) {
    const activationWidth = () => window.innerHeight * 0.1;
    const scrollAmount = () => Math.round(window.innerHeight * 0.01);
    const screenHeight = () => window.innerHeight;

    const [interval, setInterval] = createSignal<number | undefined>(undefined);
    let scrollDirection: "up" | "down" | undefined = undefined;

    function scroll() {
        switch (scrollDirection) {
            case "up":
                containerElement().parentElement?.scrollBy(0, -scrollAmount());

                break;
            case "down":
                containerElement().parentElement?.scrollBy(0, scrollAmount());

                break;
            default:
                break;
        }
    }

    const viewportTop = () => {
        const el = containerElement();
        const topBarHeight = el.parentElement!.getBoundingClientRect().top;

        return topBarHeight;
    };

    function shouldScrollUp(event: PointerEvent) {
        return event.clientY - viewportTop() - activationWidth() <= 0;
    }

    function shouldScrollDown(event: PointerEvent) {
        return event.clientY + activationWidth() >= screenHeight();
    }

    function onPointerMove(event: PointerEvent) {
        if (shouldScrollUp(event)) {
            scrollDirection = "up";

            if (interval() === undefined) {
                setInterval(window.setInterval(scroll));
            }
        } else if (shouldScrollDown(event)) {
            scrollDirection = "down";

            if (interval() === undefined) {
                setInterval(window.setInterval(scroll));
            }
        } else {
            clearInterval(interval());
            setInterval(undefined);
        }
    }

    onCleanup(() => {
        clearInterval(interval());
    });

    return {
        onAutoscrollerMove: onPointerMove,
        cancelAutoscroller: () => clearInterval(interval()),
    } as const;
}
