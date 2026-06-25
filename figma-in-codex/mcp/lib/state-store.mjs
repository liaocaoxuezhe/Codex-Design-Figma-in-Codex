import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const DEFAULT_STATE_PATH = `${process.env.HOME ?? "."}/.codex/figma-in-codex/state.json`;
export const DEFAULT_STALE_AFTER_MS = 30_000;

function nowIso() {
  return new Date().toISOString();
}

export function normalizeBridgeState(input) {
  const state = input && typeof input === "object" ? { ...input } : {};
  state.updatedAt = typeof state.updatedAt === "string" ? state.updatedAt : nowIso();
  state.source = typeof state.source === "string" ? state.source : "figma-companion-plugin";
  state.file = state.file && typeof state.file === "object" ? state.file : {};
  state.page = state.page && typeof state.page === "object" ? state.page : {};
  state.selection = Array.isArray(state.selection) ? state.selection : [];
  state.selection = state.selection.map((node) => ({
    id: String(node.id ?? ""),
    name: String(node.name ?? ""),
    type: String(node.type ?? "UNKNOWN"),
    visible: "visible" in node ? Boolean(node.visible) : true,
    locked: "locked" in node ? Boolean(node.locked) : false,
    width: typeof node.width === "number" ? node.width : undefined,
    height: typeof node.height === "number" ? node.height : undefined,
  })).filter((node) => node.id);
  return state;
}

export function createStateStore(statePath = DEFAULT_STATE_PATH, options = {}) {
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

  return {
    statePath,

    async writeState(input) {
      const state = normalizeBridgeState(input);
      await mkdir(dirname(statePath), { recursive: true });
      await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      return state;
    },

    async readState() {
      try {
        const raw = await readFile(statePath, "utf8");
        const state = normalizeBridgeState(JSON.parse(raw));
        const updatedAtMs = Date.parse(state.updatedAt);
        const ageMs = Number.isFinite(updatedAtMs) ? Date.now() - updatedAtMs : Number.POSITIVE_INFINITY;
        return {
          available: true,
          fresh: ageMs <= staleAfterMs,
          staleAfterMs,
          ageMs,
          statePath,
          state,
        };
      } catch (error) {
        return {
          available: false,
          fresh: false,
          staleAfterMs,
          ageMs: null,
          statePath,
          error: error.code === "ENOENT" ? "No bridge state has been recorded yet." : error.message,
          state: null,
        };
      }
    },
  };
}
