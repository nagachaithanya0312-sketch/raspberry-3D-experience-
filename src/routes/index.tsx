import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import normalOs from "@/assets/site/normal_os.ktx2.asset.json";

const raspberryAssetUrls = {
  "raspberry.glb": `${import.meta.env.BASE_URL}site-assets/raspberry.glb`,
  "raspberry_fuzz.bin": `${import.meta.env.BASE_URL}site-assets/raspberry_fuzz.bin`,
  "albedo.ktx2": `${import.meta.env.BASE_URL}site-assets/albedo.ktx2`,
  "normal_os.ktx2": new URL(
    normalOs.url,
    `https://${normalOs.project_id}.lovableproject.com`,
  ).href,
  "ao_rough_thick.ktx2": `${import.meta.env.BASE_URL}site-assets/ao_rough_thick.ktx2`,
  "detail_normal.ktx2": `${import.meta.env.BASE_URL}site-assets/detail_normal.ktx2`,
  "transfer_sh0.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh0.ktx2`,
  "transfer_sh1.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh1.ktx2`,
  "transfer_sh2.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh2.ktx2`,
  "transfer_sh3.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh3.ktx2`,
  "transfer_sh4.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh4.ktx2`,
  "transfer_sh5.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh5.ktx2`,
  "transfer_sh6.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh6.ktx2`,
  "transfer_sh7.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh7.ktx2`,
  "transfer_sh8.ktx2": `${import.meta.env.BASE_URL}site-assets/transfer_sh8.ktx2`,
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
      Object.entries(raspberryAssetUrls).map(([file, url]) => [file, url]),
    );
    const renderer = document.createElement("script");
    renderer.src = `${import.meta.env.BASE_URL}site-assets/raspberry-studio.js`;
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
          src={`${import.meta.env.BASE_URL}site-assets/raspberry-reference.webp`}
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
