import type {
  FetchFn,
  ModularImageOptions,
  ModularTransformInput,
  ModularTransformResult,
} from "../types";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export interface ModularClientOptions {
  apiKey: string;
  apiUrl?: string;
  fetchImpl?: FetchFn;
}

export function buildModularInputContent(input: ModularTransformInput) {
  const content: Array<Record<string, string>> = [];

  if (input.referenceImageBase64 && input.referenceMimeType) {
    content.push({
      type: "input_image",
      image_url: `data:${input.referenceMimeType};base64,${input.referenceImageBase64}`,
    });
  }

  content.push({
    type: "input_image",
    image_url: `data:${input.captureMimeType};base64,${input.captureImageBase64}`,
  });

  content.push({
    type: "input_text",
    text: input.prompt,
  });

  return content;
}

export function buildModularRequestBody(input: ModularTransformInput) {
  return {
    model: input.model,
    input: [
      {
        role: "user",
        content: buildModularInputContent(input),
      },
    ],
    provider_options: {
      image: {
        width: input.imageOptions.width,
        height: input.imageOptions.height,
        steps: input.imageOptions.steps,
        guidance_scale: input.imageOptions.guidanceScale,
      },
    },
  };
}

export class ModularClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly fetchImpl: FetchFn;

  constructor(options: ModularClientOptions) {
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl ?? "https://api.modular.com/v1/responses";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async transformImage(input: ModularTransformInput): Promise<ModularTransformResult> {
    const body = buildModularRequestBody(input);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await Bun.sleep(500 * attempt);
      }

      try {
        const response = await this.fetchImpl(this.apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (RETRYABLE_STATUS.has(response.status) && attempt === 0) {
            lastError = new Error(`Modular API error ${response.status}: ${errorText}`);
            continue;
          }
          throw new Error(`Modular API error ${response.status}: ${errorText}`);
        }

        const payload = (await response.json()) as {
          id?: string;
          output?: Array<{ content?: Array<{ image_data?: string }> }>;
        };

        const imageData = payload.output?.[0]?.content?.[0]?.image_data;
        if (!imageData) {
          throw new Error("Modular API response missing image_data");
        }

        return {
          imageData: Buffer.from(imageData, "base64"),
          requestId: payload.id ?? null,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === 1) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Modular API request failed");
  }
}

export function imageOptionsFromPreset(
  preset: {
    guidanceScale: number;
    steps: number;
    seed: number | null;
  },
  outputWidth: number,
  outputHeight: number,
  fallbackSeed: number,
): ModularImageOptions {
  return {
    width: outputWidth,
    height: outputHeight,
    steps: preset.steps,
    guidanceScale: preset.guidanceScale,
    seed: preset.seed ?? fallbackSeed,
  };
}
