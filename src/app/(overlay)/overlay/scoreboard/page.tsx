"use client";

import { useEffect, useState } from "react";

export default function OverlayScoreboard() {
  const [items, setItems] = useState<{ code: string; status: string }[]>([]);
  useEffect(() => {
    const load = () =>
      fetch("/api/public/scoreboard")
        .then((r) => r.json())
        .then((payload) => setItems(payload.matches ?? []))
        .catch(() => undefined);
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="min-h-screen bg-transparent p-4 text-white">
      {items.map((item) => (
        <p key={item.code}>
          {item.code} · {item.status}
        </p>
      ))}
    </div>
  );
}
