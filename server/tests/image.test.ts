import { describe, expect, test } from "bun:test";
import {
  computeInputResizePlan,
  computeOutputDimensions,
  snapDimension,
} from "../src/services/image";

describe("computeOutputDimensions", () => {
  test("uses 1024 as long edge for landscape", () => {
    expect(computeOutputDimensions(1600, 900)).toEqual({
      width: 1024,
      height: 576,
      aspectRatio: 1600 / 900,
    });
  });

  test("uses 1024 as long edge for portrait", () => {
    expect(computeOutputDimensions(900, 1600)).toEqual({
      width: 576,
      height: 1024,
      aspectRatio: 900 / 1600,
    });
  });

  test("handles square images", () => {
    expect(computeOutputDimensions(2000, 2000)).toEqual({
      width: 1024,
      height: 1024,
      aspectRatio: 1,
    });
  });
});

describe("computeInputResizePlan", () => {
  const config = {
    minWidth: 768,
    minHeight: 768,
    maxBytes: 1_500_000,
    maxLongEdge: 2048,
    quality: 85,
  };

  test("does not upscale small images", () => {
    expect(computeInputResizePlan(640, 480, config)).toEqual({
      width: 640,
      height: 480,
      scale: 1,
    });
  });

  test("scales down very large images", () => {
    expect(computeInputResizePlan(4032, 3024, config)).toEqual({
      width: 2048,
      height: 1536,
      scale: 2048 / 4032,
    });
  });
});

describe("snapDimension", () => {
  test("snaps to multiples of 8", () => {
    expect(snapDimension(683)).toBe(680);
    expect(snapDimension(576)).toBe(576);
  });
});
