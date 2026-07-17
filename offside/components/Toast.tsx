"use client";
export function Toast({ message, show }: { message: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-indigo text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg toast-enter z-50">
      {message}
    </div>
  );
}
