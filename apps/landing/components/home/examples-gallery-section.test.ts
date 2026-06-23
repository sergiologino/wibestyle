import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ExamplesGallerySection from "./ExamplesGallerySection";

describe("ExamplesGallerySection", () => {
  it("renders the real-model note before the gallery", () => {
    const markup = renderToStaticMarkup(createElement(ExamplesGallerySection));
    const notePosition = markup.indexOf("Только реальные модели.");
    const galleryPosition = markup.indexOf("examples-mosaic");

    expect(notePosition).toBeGreaterThanOrEqual(0);
    expect(galleryPosition).toBeGreaterThan(notePosition);
  });
});
