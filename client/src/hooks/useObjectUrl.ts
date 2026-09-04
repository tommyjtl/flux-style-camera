import { useEffect, useState } from "react";

export function useObjectUrl(source: Blob | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(source);
    setObjectUrl(nextObjectUrl);
    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [source]);

  return objectUrl;
}
