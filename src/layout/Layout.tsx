import { RouteSectionProps } from "@solidjs/router";
import { ErrorBoundary, Suspense } from "solid-js";
import LoadingIndicator from "@/components/LoadingIndicator";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout(props: RouteSectionProps) {
    return (
        <ErrorBoundary fallback={ErrorFallback}>
            <div class="flex h-full max-h-full w-full flex-col overflow-hidden bg-gray-900 text-white">
                <Header />

                <div class="flex w-full flex-grow overflow-hidden">
                    <Sidebar />
                    <div class="flex-grow overflow-hidden">
                        <div class="flex h-full w-full flex-col overflow-scroll">
                            <ErrorBoundary fallback={ErrorFallback}>
                                <Suspense fallback={<LoadingIndicator />}>
                                    {props.children}
                                </Suspense>
                            </ErrorBoundary>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}

function ErrorFallback(err: unknown, reset: () => void) {
    return (
        <div class="flex h-full flex-col items-center justify-center gap-3 bg-blue-700 p-3 text-white">
            <p>Woops something went wrong...</p>

            <p>{String(err)}</p>

            <button
                class="w-fit rounded bg-red-600 p-3 py-1 hover:bg-red-400"
                onClick={() => reset()}
            >
                Reload
            </button>
        </div>
    );
}
