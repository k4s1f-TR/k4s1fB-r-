"use client";

export function LiveStatusPill() {
  return (
    <div
      className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-lg z-10"
      style={{
        padding: "5px 10px",
        background: "rgba(12,12,12,0.85)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="tracking-widest uppercase"
          style={{ fontSize: "8.5px", color: "rgba(90,90,90,0.85)", fontWeight: 600 }}
        >
          Last Updated
        </span>
        <span
          className="font-semibold"
          style={{ fontSize: "10.5px", color: "rgba(170,170,170,0.9)" }}
        >
          03:42 UTC
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: "#4ade80",
            boxShadow: "0 0 5px rgba(74,222,128,0.6)",
          }}
        />
        <span
          className="font-medium"
          style={{ fontSize: "10.5px", color: "rgba(74,222,128,0.85)" }}
        >
          Live
        </span>
      </div>
    </div>
  );
}
