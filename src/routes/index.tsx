import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import aoRoughThick from "@/assets/site/ao_rough_thick.ktx2.asset.json";
import albedo from "@/assets/site/albedo.ktx2.asset.json";
import detailNormal from "@/assets/site/detail_normal.ktx2.asset.json";
import fallbackImage from "@/assets/site/raspberry-reference.webp.asset.json";
import normalOs from "@/assets/site/normal_os.ktx2.asset.json";
import raspberryFuzz from "@/assets/site/raspberry_fuzz.bin.asset.json";
import raspberryModel from "@/assets/site/raspberry.glb.asset.json";
import transfer0 from "@/assets/site/transfer_sh0.ktx2.asset.json";
import transfer1 from "@/assets/site/transfer_sh1.ktx2.asset.json";
import transfer2 from "@/assets/site/transfer_sh2.ktx2.asset.json";
import transfer3 from "@/assets/site/transfer_sh3.ktx2.asset.json";
import transfer4 from "@/assets/site/transfer_sh4.ktx2.asset.json";
import transfer5 from "@/assets/site/transfer_sh5.ktx2.asset.json";
import transfer6 from "@/assets/site/transfer_sh6.ktx2.asset.json";
import transfer7 from "@/assets/site/transfer_sh7.ktx2.asset.json";
import transfer8 from "@/assets/site/transfer_sh8.ktx2.asset.json";

const raspberryAssetUrls = {
  "raspberry.glb": raspberryModel.url,
  "raspberry_fuzz.bin": raspberryFuzz.url,
  "albedo.ktx2": albedo.url,
  "normal_os.ktx2": normalOs.url,
  "ao_rough_thick.ktx2": aoRoughThick.url,
  "detail_normal.ktx2": detailNormal.url,
  "transfer_sh0.ktx2": transfer0.url,
  "transfer_sh1.ktx2": transfer1.url,
  "transfer_sh2.ktx2": transfer2.url,
  "transfer_sh3.ktx2": transfer3.url,
  "transfer_sh4.ktx2": transfer4.url,
  "transfer_sh5.ktx2": transfer5.url,
  "transfer_sh6.ktx2": transfer6.url,
  "transfer_sh7.ktx2": transfer7.url,
  "transfer_sh8.ktx2": transfer8.url,
} satisfies Record<string, string>;

declare global {
  interface Window {
    __RASPBERRY_ASSETS__?: Record<string, string>;
    raspberry?: unknown;
  }
}

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    window.__RASPBERRY_ASSETS__ = Object.fromEntries(
      Object.entries(raspberryAssetUrls).map(([file, url]) => [file, new URL(url, window.location.href).href]),
    );
    const renderer = document.createElement("script");
    renderer.src = "/site-assets/raspberry-studio.js";
    renderer.type = "module";
    renderer.onload = () => {
      if (cancelled) return;
      const readyCheck = window.setInterval(() => {
        const loadingStatus = document.getElementById("loading")?.textContent ?? "";
        if (document.getElementById("loading")?.classList.contains("done")) {
          window.clearInterval(readyCheck);
          setSceneReady(true);
        } else if (loadingStatus.startsWith("failed to load:")) {
          window.clearInterval(readyCheck);
          setSceneError(true);
        }
      }, 100);
      window.setTimeout(() => window.clearInterval(readyCheck), 45_000);
    };
    renderer.onerror = () => setSceneError(true);
    container.appendChild(renderer);

    const timeoutId = window.setTimeout(() => {
      if (!window.raspberry && !cancelled) setSceneError(true);
    }, 50_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      delete window.__RASPBERRY_ASSETS__;
      renderer.remove();
    };
  }, []);

  return (
    <main className="raspberry-studio" ref={containerRef}>
      <canvas id="app" aria-label="Interactive 3D raspberry lighting studio" />
      <div id="loading" className={`studio-loading${sceneReady ? " studio-loading--hidden" : ""}`}>
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
        <button className="studio-retry" onClick={() => window.location.reload()}>
          Retry 3D scene
        </button>
      )}
    </main>
  );
}
