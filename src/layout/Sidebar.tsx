import { A } from "@solidjs/router";

export default function Sidebar() {
    return (
        <aside class="min-w-fit max-w-fit bg-gray-950 px-5">
            <nav>
                <ul class="flex flex-col gap-1">
                    <Link href="/grouped" name="Grouped" />
                    <Link href="/search" name="Search" />
                    <Link href="/resolve-dupes" name="Resolve Dupes" />
                    <Link href="/tags" name="Tags" />
                </ul>
            </nav>
        </aside>
    );
}

function Link(props: { href: string; name: string }) {
    return (
        <li>
            <A
                href={props.href}
                class="block bg-gray-800 p-2 transition-colors hover:bg-gray-600"
                activeClass="!bg-blue-600 !hover:bg-blue-500"
            >
                {props.name}
            </A>
        </li>
    );
}
