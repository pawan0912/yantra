import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Props injected into every tool component by the shell.
 */
export type ToolProps = {
  clipboardText: string;
  clipboardMatch: boolean;
};

/**
 * Tool categories — determines sidebar grouping and display order.
 * Categories are rendered in the order defined here.
 */
export const TOOL_CATEGORIES = [
  { id: "json", label: "JSON" },
  { id: "text", label: "Text" },
  { id: "web", label: "Web" },
  { id: "misc", label: "Misc" },
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number]["id"];

/**
 * The plugin interface every tool must implement.
 * This is the contract between a tool and the app shell.
 */
export type ToolPlugin = {
  /** Unique identifier (kebab-case) */
  id: string;
  /** Display name shown in sidebar and title bar */
  name: string;
  /** Short description shown in command palette */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Category for sidebar grouping */
  category: ToolCategory;
  /** Lazy-loaded React component */
  component: LazyExoticComponent<ComponentType<ToolProps>>;
  /** Search tags for command palette fuzzy matching */
  tags: string[];
  /** Returns true if clipboard content is relevant to this tool */
  matchClipboard: (text: string) => boolean;
};

/**
 * Per-tool user configuration — persisted via Jotai.
 */
export type ToolConfig = {
  enabled: boolean;
  order: number;
};
