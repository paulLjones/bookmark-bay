import { Accessor, createSignal, onCleanup } from "solid-js";

export default function createAutoScroller(
    containerElement: Accessor<HTMLElement>,
) {
    const activationWidth = () => window.innerHeight * 0.1;
    const scrollAmount = () => Math.round(window.innerHeight * 0.01);
    const screenHeight = () => window.innerHeight;

    const [interval, setInterval] = createSignal<number | undefined>(undefined);
    let scrollDirection: "up" | "down" | undefined = undefined;
    let lastEvent: DragEvent | undefined = undefined;

    function scroll() {
        if (!lastEvent) return;

        let scrollPercentage;

        switch (scrollDirection) {
            case "up":
                scrollPercentage =
                    (activationWidth() - (lastEvent.clientY - viewportTop())) /
                    activationWidth();

                containerElement().parentElement?.scrollBy(
                    0,
                    Math.round(-scrollAmount() * scrollPercentage),
                );

                break;
            case "down":
                scrollPercentage =
                    (activationWidth() - (screenHeight() - lastEvent.clientY)) /
                    activationWidth();

                containerElement().parentElement?.scrollBy(
                    0,
                    Math.round(scrollAmount() * scrollPercentage),
                );

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

    function shouldScrollUp(event: DragEvent) {
        return event.clientY - viewportTop() - activationWidth() <= 0;
    }

    function shouldScrollDown(event: DragEvent) {
        return event.clientY + activationWidth() >= screenHeight();
    }

    function onPointerMove(event: DragEvent) {
        lastEvent = event;
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
