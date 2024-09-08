export default function LoadingIndicator() {
    return (
        <div class="flex h-full min-h-20 w-full min-w-20 items-center justify-center">
            <div class="aspect-square h-1/2 animate-spin rounded-full border-l border-t border-white" />
        </div>
    );
}
