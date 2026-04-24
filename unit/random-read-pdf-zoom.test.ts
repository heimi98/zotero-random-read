import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import * as randomRead from "../src/modules/random-read";

function requireRandomReadHelper(name: string) {
  const helper = (randomRead as Record<string, unknown>)[name];
  assert.equal(
    typeof helper,
    "function",
    `${name} should be exported as a function`,
  );
  return helper as (...args: any[]) => any;
}

test("shouldApplyDefaultPdfZoom applies to every built-in PDF open", () => {
  const shouldApplyDefaultPdfZoom = requireRandomReadHelper(
    "shouldApplyDefaultPdfZoom",
  );

  assert.equal(
    shouldApplyDefaultPdfZoom({
      attachmentReaderType: "pdf",
    }),
    true,
  );
  assert.equal(
    shouldApplyDefaultPdfZoom({
      attachmentReaderType: "epub",
    }),
    false,
  );
});

test("resolveDefaultPdfZoomValue maps settings to reader scale values", () => {
  const resolveDefaultPdfZoomValue = requireRandomReadHelper(
    "resolveDefaultPdfZoomValue",
  );

  assert.equal(
    resolveDefaultPdfZoomValue({ mode: "actual-size", customPercent: 90 }),
    1,
  );
  assert.equal(
    resolveDefaultPdfZoomValue({ mode: "page-fit", customPercent: 90 }),
    "page-fit",
  );
  assert.equal(
    resolveDefaultPdfZoomValue({ mode: "page-width", customPercent: 90 }),
    "page-width",
  );
  assert.equal(
    resolveDefaultPdfZoomValue({ mode: "custom", customPercent: 90 }),
    0.9,
  );
});

test("startup hooks install global PDF default zoom behavior", () => {
  const hooksSource = readFileSync(
    path.join(process.cwd(), "src/hooks.ts"),
    "utf8",
  );

  assert.ok(hooksSource.includes("installPdfDefaultZoomBehavior"));
  assert.ok(hooksSource.includes("uninstallPdfDefaultZoomBehavior"));
});

test("pdf default zoom waits for the reader view to finish initializing", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/pdf-default-zoom.ts"),
    "utf8",
  );

  assert.ok(source.includes("initializedPromise"));
});

test("pdf default zoom no longer checks persisted reader state before applying", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/pdf-default-zoom.ts"),
    "utf8",
  );

  assert.ok(!source.includes("hasExistingPdfReaderState"));
  assert.ok(!source.includes("isPdfReaderAlreadyOpen"));
});
