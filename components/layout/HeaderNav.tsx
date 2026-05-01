"use client";
import { Search, Bell, Sun } from "lucide-react";

const NAV_TABS = [
  "Situation",
  "Politics",
  "Conflict",
  "Intel Watch",
  "Air",
  "Maritime",
  "Sources",
];

function IconBtn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-150 ${className}`}
      style={{ color: "rgba(110,110,110,0.9)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(200,200,200,0.9)";
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(90,108,138,0.9)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

export function HeaderNav() {
  return (
    <header
      className="flex items-center flex-shrink-0 px-5"
      style={{
        height: "52px",
        background: "rgba(10, 10, 10, 0.98)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Brand */}
      <div className="flex flex-col justify-center mr-10" style={{ minWidth: "190px" }}>
        <span
          className="leading-tight font-bold tracking-tight"
          style={{ fontSize: "15px", color: "rgba(220,220,220,0.95)" }}
        >
          BörüEyes
        </span>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-0.5 flex-1">
        {NAV_TABS.map((tab) => {
          const active = tab === "Situation";
          return (
            <button
              key={tab}
              className="relative px-3 h-full flex items-center transition-colors duration-150"
              style={{
                height: "52px",
                fontSize: "12px",
                fontWeight: active ? 500 : 400,
                color: active
                  ? "rgba(147,197,253,0.95)"
                  : "rgba(100,100,100,0.85)",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(190,190,190,0.9)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(100,100,100,0.85)";
              }}
            >
              {tab}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
                  style={{ background: "rgba(96,165,250,0.8)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        <IconBtn>
          <Search size={14} />
        </IconBtn>

        <div className="relative">
          <IconBtn>
            <Bell size={14} />
          </IconBtn>
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              background: "#3b82f6",
              boxShadow: "0 0 5px rgba(59,130,246,0.7)",
            }}
          />
        </div>

        <IconBtn>
          <Sun size={14} />
        </IconBtn>

        <div
          className="ml-1.5 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer select-none"
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "rgba(186,230,253,0.9)",
            background: "linear-gradient(145deg, #0f2545 0%, #1d4ed8 100%)",
            border: "1px solid rgba(59,130,246,0.3)",
          }}
        >
          AB
        </div>
      </div>
    </header>
  );
}
