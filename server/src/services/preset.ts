import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { StylePreset } from "../types";

export const DEFAULT_PRESET_ID = "travel-gouache-v1";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadDefaultPreset(dataDir: string): Promise<StylePreset> {
  const promptPath = join(dataDir, "presets", DEFAULT_PRESET_ID, "prompt.txt");
  const prompt = (await readFile(promptPath, "utf8")).trim();
  const referenceImagePath = join(dataDir, "presets", DEFAULT_PRESET_ID, "reference.jpg");

  return {
    id: DEFAULT_PRESET_ID,
    name: "Travel Gouache",
    prompt,
    referenceImagePath: (await fileExists(referenceImagePath)) ? referenceImagePath : null,
    model: "black-forest-labs/FLUX.2-klein-4B",
    guidanceScale: 7.5,
    steps: 4,
    seed: 42,
    enabled: true,
  };
}
