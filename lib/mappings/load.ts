import fs from "fs";
import path from "path";
import type { MappingRegistry } from "@/lib/mappings/types";

const REGISTRY_PATH = path.join(process.cwd(), "fixtures", "mappings", "registry.json");

let cached: MappingRegistry | null | undefined;

function emptyRegistry(): MappingRegistry {
  return { version: 1, players: [], matches: [] };
}

export function getRegistryPath(): string {
  return REGISTRY_PATH;
}

/** Load mapping registry from disk; returns empty registry if file is missing. */
export function loadMappingRegistry(): MappingRegistry {
  if (cached !== undefined) return cached ?? emptyRegistry();
  try {
    if (!fs.existsSync(REGISTRY_PATH)) {
      cached = null;
      return emptyRegistry();
    }
    const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as MappingRegistry;
    if (raw.version !== 1 || !Array.isArray(raw.players) || !Array.isArray(raw.matches)) {
      cached = null;
      return emptyRegistry();
    }
    cached = raw;
    return raw;
  } catch {
    cached = null;
    return emptyRegistry();
  }
}

export function clearMappingRegistryCache(): void {
  cached = undefined;
}
