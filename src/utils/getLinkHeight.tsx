import { render } from "solid-js/web";
import Button from "@/components/Button";

function getButtonHeight() {
    const container = document.createElement("div");

    document.body.appendChild(container);
    const cleanup = render(
        () => (
            <Button color="blue" rounded>
                Add Link
            </Button>
        ),
        container,
    );
    const height = container.getBoundingClientRect().height;
    cleanup();

    document.body.removeChild(container);

    return height;
}

function getLinkHeight() {
    const buttonHeight = getButtonHeight();

    const rootStyles = window.getComputedStyle(document.body.parentElement!);
    const rootFontSize = parseFloat(rootStyles.fontSize);

    return buttonHeight + rootFontSize * 0.75 * 2;
}

const linkHeight = getLinkHeight();

export default () => linkHeight;
