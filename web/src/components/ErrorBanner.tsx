interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="rounded-lg bg-danger/10 border border-danger/30 p-4 flex items-start gap-3 animate-in">
      <span className="text-danger text-lg leading-none shrink-0">⚠</span>
      <p className="flex-1 min-w-0 text-sm text-danger font-medium">
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-danger/60 hover:text-danger text-sm shrink-0 cursor-pointer"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
