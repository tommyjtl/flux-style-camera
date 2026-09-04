import { useCallback, useEffect, useState } from "react";
import {
  addPrint,
  clearRoll,
  deletePrint,
  FILM_CAPACITY,
  getPrintCount,
  getRemainingExposures,
} from "@/lib/film-roll";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import type { CameraFacing, FilmPrint } from "@/types";

export type FlowStage = "camera" | "developing";
export type AppTab = "camera" | "gallery";
export type PrintViewSource = "capture" | "gallery";

interface PendingCapture {
  photo: Blob;
  camera: CameraFacing;
  aspectRatio: number;
}

export function useCaptureFlow() {
  const [tab, setTab] = useState<AppTab>("camera");
  const [stage, setStage] = useState<FlowStage>("camera");
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
  const [activePrint, setActivePrint] = useState<FilmPrint | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const outputUrl = useObjectUrl(outputBlob);
  const [remainingExposures, setRemainingExposures] = useState(FILM_CAPACITY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewSource, setViewSource] = useState<PrintViewSource | null>(null);
  const [rollVersion, setRollVersion] = useState(0);
  const [developAbort, setDevelopAbort] = useState<AbortController | null>(null);
  const [canCancelDevelop, setCanCancelDevelop] = useState(false);

  const bumpRoll = useCallback(() => {
    setRollVersion((version) => version + 1);
  }, []);

  const refreshRemaining = useCallback(async () => {
    setRemainingExposures(await getRemainingExposures());
  }, []);

  useEffect(() => {
    void refreshRemaining();
  }, [refreshRemaining]);

  const resetToCamera = useCallback(() => {
    setDevelopAbort((current) => {
      current?.abort();
      return null;
    });
    setStage("camera");
    setPendingCapture(null);
    setActivePrint(null);
    setOutputBlob(null);
    setError(null);
    setViewSource(null);
    setTab("camera");
    setCanCancelDevelop(false);
  }, []);

  const handleCapture = async (
    photo: Blob,
    camera: CameraFacing,
    aspectRatio: number,
  ) => {
    setBusy(true);
    setError(null);

    try {
      const remaining = await getRemainingExposures();
      if (remaining <= 0) {
        return;
      }

      setActivePrint(null);
      setOutputBlob(null);
      const controller = new AbortController();
      setDevelopAbort(controller);
      setCanCancelDevelop(false);
      setPendingCapture({
        photo,
        camera,
        aspectRatio,
      });
      setStage("developing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start capture");
    } finally {
      setBusy(false);
    }
  };

  const handleGallerySelect = (selected: FilmPrint) => {
    setActivePrint(selected);
    setOutputBlob(selected.outputBlob);
    setViewSource("gallery");
    setStage("camera");
    setTab("camera");
  };

  const handleDevelopingComplete = async (result: {
    outputBlob: Blob;
    aspectRatio: number;
    outputWidth: number;
    outputHeight: number;
    presetId: string;
  }) => {
    if (!pendingCapture) return;

    const print: FilmPrint = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      camera: pendingCapture.camera,
      aspectRatio: result.aspectRatio,
      outputWidth: result.outputWidth,
      outputHeight: result.outputHeight,
      presetId: result.presetId,
      outputBlob: result.outputBlob,
      previewBlob: pendingCapture.photo,
    };

    try {
      await addPrint(print);
      setPendingCapture(null);
      setDevelopAbort(null);
      setActivePrint(print);
      setOutputBlob(result.outputBlob);
      setViewSource("capture");
      setStage("camera");
      await refreshRemaining();
      bumpRoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save print");
    }
  };

  const handleDevelopingFailed = (message: string) => {
    setError(message);
    resetToCamera();
  };

  const handleDevelopingCancelled = useCallback(() => {
    setCanCancelDevelop(false);
    resetToCamera();
  }, [resetToCamera]);

  const handleCancelAvailableChange = useCallback((available: boolean) => {
    setCanCancelDevelop(available);
  }, []);

  const cancelDeveloping = useCallback(() => {
    developAbort?.abort();
  }, [developAbort]);

  const dismissError = () => {
    setError(null);
  };

  const openGallery = () => {
    if (stage === "developing" && !outputBlob) {
      return;
    }
    setTab("gallery");
  };

  const backToCamera = () => {
    setTab("camera");
  };

  const backFromPrintView = useCallback(() => {
    if (viewSource === "gallery") {
      setActivePrint(null);
      setOutputBlob(null);
      setViewSource(null);
      setTab("gallery");
      return;
    }
    resetToCamera();
  }, [viewSource, resetToCamera]);

  const handleDeleteActivePrint = async () => {
    if (!activePrint) return;
    if (!window.confirm("Remove this print from your roll?")) return;

    try {
      await deletePrint(activePrint.id);
      setActivePrint(null);
      setOutputBlob(null);
      await refreshRemaining();
      bumpRoll();

      if (viewSource === "gallery") {
        setViewSource(null);
        setTab("gallery");
      } else {
        resetToCamera();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete print");
    }
  };

  const handleClearRoll = async () => {
    try {
      const count = await getPrintCount();
      if (count === 0) return;

      await clearRoll();
      setActivePrint(null);
      setOutputBlob(null);
      setViewSource(null);
      await refreshRemaining();
      bumpRoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear roll");
    }
  };

  return {
    tab,
    stage,
    pendingCapture,
    activePrint,
    outputUrl,
    remainingExposures,
    printCount: FILM_CAPACITY - remainingExposures,
    busy,
    error,
    handleCapture,
    handleGallerySelect,
    handleDevelopingComplete,
    handleDevelopingFailed,
    handleDevelopingCancelled,
    handleCancelAvailableChange,
    cancelDeveloping,
    canCancelDevelop,
    developAbort,
    dismissError,
    openGallery,
    backToCamera,
    backFromPrintView,
    resetToCamera,
    refreshRemaining,
    handleDeleteActivePrint,
    handleClearRoll,
    rollVersion,
    viewSource,
    getPrintCount,
  };
}
