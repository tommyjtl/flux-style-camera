interface AppErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function AppErrorBanner({ message, onDismiss }: AppErrorBannerProps) {
  return (
    <div className="w-full max-w-[min(100%,320px)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
      <button type="button" className="ml-2 underline" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
