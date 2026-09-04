import type { CameraFacing, TransformResponse } from "@/lib/film-roll";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function transformPhoto(
  photo: Blob,
  camera: CameraFacing,
  signal?: AbortSignal,
): Promise<TransformResponse> {
  const formData = new FormData();
  formData.append("photo", photo, "capture.jpg");
  formData.append("camera", camera);

  const response = await fetch(apiUrl("/api/transform"), {
    method: "POST",
    body: formData,
    signal,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Transform failed (${response.status})`);
  }

  const outputBlob = await response.blob();
  const aspectRatio = Number(response.headers.get("X-Fluxoid-Aspect-Ratio") ?? "1");
  const outputWidth = Number(response.headers.get("X-Fluxoid-Output-Width") ?? "0");
  const outputHeight = Number(response.headers.get("X-Fluxoid-Output-Height") ?? "0");
  const presetId = response.headers.get("X-Fluxoid-Preset-Id") ?? "travel-gouache-v1";

  return {
    outputBlob,
    aspectRatio,
    outputWidth,
    outputHeight,
    presetId,
  };
}
