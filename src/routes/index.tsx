import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import papayaWhole from "@/assets/papaya-whole.jpg";

const PapayaScene = lazy(() => import("@/components/PapayaScene"));

class PapayaSceneBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="papaya-scene-error" role="alert">
          <p>The 3D specimen could not load.</p>
          <Button type="button" variant="ghost" className="papaya-scene-retry" onClick={() => window.location.reload()}>
            Retry 3D view
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Papaya Light Studio — Interactive 3D Fruit Study" },
      {
        name: "description",
        content: "Rotate a photoreal 3D papaya and a seeded cutaway view in a responsive studio, with warm or daylight lighting.",
      },
      { property: "og:title", content: "Papaya Light Studio — Interactive 3D Fruit Study" },
      {
        property: "og:description",
        content: "A photoreal, rotatable 3D papaya and cutaway study with warm or daylight lighting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PapayaStudio,
});

function PapayaStudio() {
  const [isCut, setIsCut] = useState(false);
  const [warmLight, setWarmLight] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  const showWholeFruit = () => {
    setSceneReady(false);
    setIsCut(false);
  };

  const showCutFruit = () => {
    setSceneReady(false);
    setIsCut(true);
  };

  return (
    <main className={`papaya-studio${warmLight ? " papaya-studio--warm" : ""}`}>
      <header className="papaya-header">
        <a className="papaya-mark" href="#papaya" aria-label="Papaya studio home">
          <span className="papaya-mark__dot" />
          FIELD NOTES <span className="papaya-mark__slash">/</span> FRUIT STUDY
        </a>
        <span className="papaya-edition">TROPICAL COLLECTION <span>01 — 04</span></span>
      </header>

      <section className={`papaya-stage${isCut ? " papaya-stage--cut" : ""}`} id="papaya">
        <div className="papaya-caption" aria-live="polite">
          <span className="papaya-eyebrow">CARICA PAPAYA · {isCut ? "INTERIOR" : "RIPE"}</span>
          <h1>Papaya</h1>
          <p>{isCut ? "A sun-warmed center, held in seed." : "Color gathered slowly in the sun."}</p>
        </div>
        <figure className="papaya-fruit">
          <div className="papaya-model-view" data-scene-ready={sceneReady ? "true" : undefined}>
            <div
              className={`papaya-model-fallback${sceneReady ? " papaya-model-fallback--hidden" : ""}`}
              aria-hidden={sceneReady}
            >
              <img src={papayaWhole} alt="" width={1024} height={1280} fetchPriority="high" decoding="async" />
              <span className="papaya-model-loading" aria-live="polite">
                {sceneReady ? "" : "Preparing specimen"}
              </span>
            </div>
            <PapayaSceneBoundary>
              <ClientOnly fallback={<div className="papaya-scene-placeholder" aria-hidden="true" />}>
                <Suspense fallback={<div className="papaya-scene-placeholder" aria-hidden="true" />}>
                  <PapayaScene warmLight={warmLight} cutaway={isCut} onReady={handleSceneReady} />
                </Suspense>
              </ClientOnly>
            </PapayaSceneBoundary>
          </div>
          <figcaption className="papaya-image-note">{isCut ? "THE OPEN FRUIT" : "HARVEST STUDY · NO. 01"}</figcaption>
        </figure>
      </section>

      <footer className="papaya-controls">
        <div className="papaya-view-toggle" role="group" aria-label="Papaya view">
          <Button
            type="button"
            variant="ghost"
            className={`papaya-control${!isCut ? " papaya-control--selected" : ""}`}
            aria-pressed={!isCut}
            onClick={showWholeFruit}
          >
            Whole fruit
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`papaya-control${isCut ? " papaya-control--selected" : ""}`}
            aria-pressed={isCut}
            onClick={showCutFruit}
          >
            Cut open
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="papaya-light-control"
          aria-pressed={warmLight}
          onClick={() => setWarmLight((current) => !current)}
        >
          <span className="papaya-light-indicator" />
          {warmLight ? "Warm light" : "Daylight"}
        </Button>
        <span className="papaya-footnote">A STUDY IN LIGHT &amp; RIPENESS</span>
      </footer>
    </main>
  );
}