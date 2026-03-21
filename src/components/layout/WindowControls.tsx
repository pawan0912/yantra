import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";

export function WindowControls(): React.ReactElement {
  const [hovered, setHovered] = useState(false);

  const handleClose = (): void => {
    getCurrentWindow().hide().catch(() => {});
  };

  const handleMinimize = (): void => {
    getCurrentWindow().minimize().catch(() => {});
  };

  const handleMaximize = (): void => {
    getCurrentWindow().toggleMaximize().catch(() => {});
  };

  return (
    <div
      className="flex items-center gap-2 pl-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all duration-150 flex items-center justify-center"
        title="Close"
      >
        {hovered && (
          <svg className="w-1.5 h-1.5 text-[#4D0000]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        )}
      </button>
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all duration-150 flex items-center justify-center"
        title="Minimize"
      >
        {hovered && (
          <svg className="w-1.5 h-1.5 text-[#995700]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2 6h8" />
          </svg>
        )}
      </button>
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-[#28C840] hover:brightness-90 transition-all duration-150 flex items-center justify-center"
        title="Maximize"
      >
        {hovered && (
          <svg className="w-1.5 h-1.5 text-[#006500]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 3h6v6H3z" />
          </svg>
        )}
      </button>
    </div>
  );
}
