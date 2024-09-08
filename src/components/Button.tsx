import { JSXElement } from "solid-js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const colourClasses = {
    red: "bg-red-600 hover:bg-red-400",
    green: "bg-green-500 hover:bg-green-400",
    blue: "bg-blue-700 hover:bg-blue-500",
    darkRed: "bg-red-950 hover:bg-red-800",
    darkGreen: "bg-green-950 hover:bg-green-800",
    darkBlue: "bg-blue-950 hover:bg-blue-800",
    darkYellow: "bg-yellow-950 hover:bg-yellow-800",
} as const;

type ButtonColor = keyof typeof colourClasses;

type ButtonProps = {
    color: ButtonColor;
    rounded?: boolean;
    onClick?: (event: MouseEvent) => unknown;
    onPointerDown?: (event: MouseEvent) => unknown;
    class?: string;
    children?: JSXElement;
};

export default function Button(props: ButtonProps) {
    return (
        <button
            classList={{
                "flex items-center justify-center transition-colors px-3 py-2":
                    true,
                [colourClasses[props.color]]: !!props.color,
                rounded: props.rounded,
                [props.class ?? ""]: true,
            }}
            onClick={(e) => props.onClick?.(e)}
            onPointerDown={(e) => props.onPointerDown?.(e)}
        >
            {props.children}
        </button>
    );
}
