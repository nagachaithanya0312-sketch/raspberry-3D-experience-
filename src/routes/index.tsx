import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import fallbackImage from "@/assets/site/raspberry-reference.webp.asset.json";

const raspberryAssetUrls = {
  "raspberry.glb": new URL("@/assets/site/raspberry.glb.asset.json", import.meta.url).href,
  "raspberry_fuzz.bin": new URL("@/assets/site/raspberry_fuzz.bin.asset.json", import.meta.url).href,
  "albedo.ktx2": new URL("@/assets/site/albedo.ktx2.asset.json", import.meta.url).href,
  "normal_os.ktx2": new URL("@/assets/site/normal_os.ktx2.asset.json", import.meta.url).href,
  "ao_rough_thick.ktx2": new URL("@/assets/site/ao_rough_thick.ktx2.asset.json", import.meta.url).href,
  "detail_normal.ktx2": new URL("@/assets/site/detail_normal.ktx2.asset.json", import.meta.url).href,
  "transfer_sh0.ktx2": new URL("@/assets/site/transfer_sh0.ktx2.asset.json", import.meta.url).href,
  "transfer_sh1.ktx2": new URL("@/assets/site/transfer_sh1.ktx2.asset.json", import.meta.url).href,
  "transfer_sh2.ktx2": new URL("@/assets/site/transfer_sh2.ktx2.asset.json", import.meta.url).href,
  "transfer_sh3.ktx2": new URL("@/assets/site/transfer_sh3.ktx2.asset.json", import.meta.url).href,
  "transfer_sh4.ktx2": new URL("@/assets/site/transfer_sh4.ktx2.asset.json", import.meta.url).href,
  "transfer_sh5.ktx2": new URL("@/assets/site/transfer_sh5.ktx2.asset.json", import.meta.url).href,
  "transfer_sh6.ktx2": new URL("@/assets/site/transfer_sh6.ktx2.asset.json", import.meta.url).href,
  "transfer_sh7.ktx2": new URL("@/assets/site/transfer_sh7.ktx2.asset.json", import.meta.url).href,
  "transfer_sh8.ktx2": new URL("@/assets/site/transfer_sh8.ktx2.asset.json", import.meta.url).href,
} satisfies Record<string, string>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Raspberry Studio — Interactive 3D Lighting" },
      {
        name: "description",
        content: "Explore and shape a photorealistic raspberry with an interactive 3D lighting studio.",
      },
      { property: "og:title", content: "Raspberry Studio — Interactive 3D Lighting" },
      {
        property: "og:description",
        content: "Explore and shape a photorealistic raspberry with an interactive 3D lighting studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const containerRef = useRef<HTMLElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    let cancelled = false;
    window.__RASPBERRY_ASSETS__ = Object.fromEntries(
      Object.entries(raspberryAssetUrls).map(([file, url]) => [file, new URL(url, window.location.href).href]),
    );

    const onLoad = () => {
      if (cancelled) return;
      script.dataset.loaded = "true";
      const renderer = document.createElement("script");
      renderer.src = "/site-assets/raspberry-studio.js";
      renderer.async = true;
      renderer.onload = () => {
        if (cancelled) return;
        const readyCheck = window.setInterval(() => {
          if (window.raspberry) {
            window.clearInterval(readyCheck);
            setSceneReady(true);
          }
        }, 100);
        window.setTimeout(() => window.clearInterval(readyCheck), 12_000);
      };
      renderer.onerror = () => setSceneError(true);
      container.appendChild(renderer);
    };

    script.onload = onLoad;
    script.onerror = () => setSceneError(true);
    script.src = "https://unpkg.com/three@0.186.0/build/three.min.js";
    script.async = true;
    container.appendChild(script);

    const timeoutId = window.setTimeout(() => {
      if (!window.raspberry && !cancelled) setSceneError(true);
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      delete window.__RASPBERRY_ASSETS__;
      delete window.raspberry;
      container.replaceChildren();
    };
  }, [retryKey]);

  return (
    <main className="raspberry-studio" ref={containerRef}>
      <canvas id="app" aria-label="Interactive 3D raspberry lighting studio" />
      <div className={`studio-loading${sceneReady ? " studio-loading--hidden" : ""}`}>
        <img
          className="studio-fallback"
          src={fallbackImage.url}
          alt="A close-up, photorealistic red raspberry on black"
          width={640}
          height={780}
          fetchPriority="high"
          decoding="async"
        />
        <span>{sceneError ? "3D scene unavailable" : "loading raspberry…"}</span>
      </div>
      {sceneError && (
        <button className="studio-retry" onClick={() => { setSceneError(false); setSceneReady(false); setRetryKey((value) => value + 1); }}>
          Retry 3D scene
        </button>
      )}
    </main>
  );
}
