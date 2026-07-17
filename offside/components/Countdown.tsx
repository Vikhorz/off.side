"use client";
import { useEffect, useState } from "react";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export function Countdown({ target, label }: { target: string; label: string }) {
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!time) return null;

  const units = [
    { value: time.days, label: "days" },
    { value: time.hours, label: "hrs" },
    { value: time.minutes, label: "min" },
    { value: time.seconds, label: "sec" },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-bg to-navy border border-indigo-bg rounded-xl p-4">
      <div className="text-[11px] text-indigo-mid font-medium mb-3 uppercase tracking-wide">{label}</div>
      <div className="flex gap-3">
        {units.map((u) => (
          <div key={u.label} className="flex-1 text-center">
            <div className="font-mono text-2xl font-medium text-warm tabular-nums">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="text-[10px] text-steel mt-0.5">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
