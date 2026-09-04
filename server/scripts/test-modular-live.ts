import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { loadConfig } from "../src/config";
import { ModularClient } from "../src/services/modular";

const config = loadConfig();

if (!config.modularApiKey) {
  console.error("MODULAR_API_KEY is not set in server/.env");
  process.exit(1);
}

console.log("Testing Modular API…");
console.log(`  URL: ${config.modularApiUrl}`);
console.log(`  Key: set (${config.modularApiKey.length} chars)`);

const testImage = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 3,
    background: { r: 100, g: 150, b: 200 },
  },
})
  .jpeg()
  .toBuffer();

const base64 = testImage.toString("base64");
const client = new ModularClient({
  apiKey: config.modularApiKey,
  apiUrl: config.modularApiUrl,
});

const started = Date.now();

try {
  const result = await client.transformImage({
    captureImageBase64: base64,
    captureMimeType: "image/jpeg",
    prompt: (await readFile(
      join(config.dataDir, "presets/travel-gouache-v1/prompt.txt"),
      "utf8",
    )).trim(),
    model: "black-forest-labs/FLUX.2-klein-4B",
    imageOptions: {
      width: 512,
      height: 512,
      steps: config.modularSteps,
      guidanceScale: config.modularGuidanceScale,
      seed: config.modularSeed,
    },
  });

  const outPath = join(config.dataDir, "test-modular-output.png");
  await Bun.write(outPath, result.imageData);

  console.log(`\nSuccess in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`  Request ID: ${result.requestId ?? "n/a"}`);
  console.log(`  Output: ${outPath} (${result.imageData.byteLength} bytes)`);
} catch (error) {
  console.error("\nModular API test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
