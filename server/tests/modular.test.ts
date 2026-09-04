import { describe, expect, test } from "bun:test";
import { buildModularInputContent, buildModularRequestBody } from "../src/services/modular";

describe("Modular prompt assembly", () => {
  test("builds text + capture image content", () => {
    const content = buildModularInputContent({
      captureImageBase64: "abc123",
      captureMimeType: "image/jpeg",
      prompt: "Transform this photo.",
      model: "black-forest-labs/FLUX.2-klein-4B",
      imageOptions: {
        width: 768,
        height: 1024,
        steps: 4,
        guidanceScale: 7.5,
        seed: 42,
      },
    });

    expect(content).toEqual([
      {
        type: "input_image",
        image_url: "data:image/jpeg;base64,abc123",
      },
      {
        type: "input_text",
        text: "Transform this photo.",
      },
    ]);
  });

  test("includes reference image before capture when provided", () => {
    const content = buildModularInputContent({
      captureImageBase64: "capture",
      captureMimeType: "image/jpeg",
      referenceImageBase64: "reference",
      referenceMimeType: "image/png",
      prompt: "Transform this photo.",
      model: "black-forest-labs/FLUX.2-klein-4B",
      imageOptions: {
        width: 1024,
        height: 768,
        steps: 4,
        guidanceScale: 7.5,
        seed: 42,
      },
    });

    expect(content[0]).toEqual({
      type: "input_image",
      image_url: "data:image/png;base64,reference",
    });
    expect(content[1]).toEqual({
      type: "input_image",
      image_url: "data:image/jpeg;base64,capture",
    });
  });

  test("builds provider options from preset settings", () => {
    const body = buildModularRequestBody({
      captureImageBase64: "capture",
      captureMimeType: "image/jpeg",
      prompt: "Transform this photo.",
      model: "black-forest-labs/FLUX.2-klein-4B",
      imageOptions: {
        width: 768,
        height: 1024,
        steps: 4,
        guidanceScale: 7.5,
        seed: 42,
      },
    });

    expect(body.provider_options.image).toEqual({
      width: 768,
      height: 1024,
      steps: 4,
      guidance_scale: 7.5,
    });
  });
});
