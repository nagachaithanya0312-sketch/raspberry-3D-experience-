import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import papayaCut from "@/assets/papaya-cut.jpg";
import papayaWhole from "@/assets/papaya-whole.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Papaya Light Studio — Tropical Fruit Study" },
      {
        name: "description",
        content: "A tactile visual study of ripe papaya, natural color, and studio light.",
      },
      { property: "og:title", content: "Papaya Light Studio — Tropical Fruit Study" },
      {
        property: "og:description",
        content: "A tactile visual study of ripe papaya, natural color, and studio light.",
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
          <img
            key={isCut ? "cut" : "whole"}
            src={isCut ? papayaCut : papayaWhole}
            alt={isCut ? "Two papaya halves showing orange flesh and black seeds" : "A ripe golden-green papaya"}
            width={1024}
            height={1280}
            fetchPriority="high"
            decoding="async"
          />
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
            onClick={() => setIsCut(false)}
          >
            Whole fruit
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`papaya-control${isCut ? " papaya-control--selected" : ""}`}
            aria-pressed={isCut}
            onClick={() => setIsCut(true)}
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