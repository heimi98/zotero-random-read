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

test("pdf default zoom wrapper does not delay the native reader open on item metadata", async () => {
  const originalZotero = (globalThis as Record<string, unknown>).Zotero;
  const originalSetTimeout = globalThis.setTimeout;
  const { promise: itemPromise, resolve: resolveItem } = createDeferred();
  const reader = createPdfReader();
  let nativeOpenCalled = false;

  (globalThis as Record<string, unknown>).Zotero = {
    Reader: {
      open: async () => {
        nativeOpenCalled = true;
        return reader;
      },
    },
    Items: {
      getAsync: async () => itemPromise,
    },
    Prefs: {
      get: (key: string) =>
        key.endsWith("defaultPdfZoomMode") ? "page-width" : 100,
    },
    Promise: {
      delay: async () => undefined,
    },
    logError: () => undefined,
  };
  globalThis.setTimeout = noopSetTimeout;

  const { installPdfDefaultZoomBehavior, uninstallPdfDefaultZoomBehavior } =
    await import("../src/modules/pdf-default-zoom");

  try {
    installPdfDefaultZoomBehavior();
    const openPromise = (
      (globalThis as any).Zotero.Reader.open as (...args: any[]) => Promise<any>
    )(101);
    await waitForMacrotask(originalSetTimeout);

    assert.equal(nativeOpenCalled, true);

    resolveItem({ attachmentReaderType: "pdf" });
    assert.equal(await openPromise, reader);
  } finally {
    resolveItem({ attachmentReaderType: "pdf" });
    await waitForMacrotask(originalSetTimeout);
    uninstallPdfDefaultZoomBehavior();
    (globalThis as Record<string, unknown>).Zotero = originalZotero;
    globalThis.setTimeout = originalSetTimeout;
  }
});

test("pdf default zoom wrapper returns before PDF pages finish loading", async () => {
  const originalZotero = (globalThis as Record<string, unknown>).Zotero;
  const originalSetTimeout = globalThis.setTimeout;
  const reader = createPdfReader();

  (globalThis as Record<string, unknown>).Zotero = {
    Reader: {
      open: async () => reader,
    },
    Items: {
      getAsync: async () => ({ attachmentReaderType: "pdf" }),
    },
    Prefs: {
      get: (key: string) =>
        key.endsWith("defaultPdfZoomMode") ? "page-width" : 100,
    },
    Promise: {
      delay: async () => undefined,
    },
    logError: () => undefined,
  };
  globalThis.setTimeout = noopSetTimeout;

  const { installPdfDefaultZoomBehavior, uninstallPdfDefaultZoomBehavior } =
    await import("../src/modules/pdf-default-zoom");

  try {
    installPdfDefaultZoomBehavior();
    const openPromise = (
      (globalThis as any).Zotero.Reader.open as (...args: any[]) => Promise<any>
    )(101);
    const result = await Promise.race([
      openPromise.then((value) => ({ state: "resolved", value })),
      waitForMacrotask(originalSetTimeout).then(() => ({ state: "pending" })),
    ]);

    assert.equal(result.state, "resolved");
    assert.equal("value" in result ? result.value : undefined, reader);
    await waitForMacrotask(originalSetTimeout);
    assert.equal(
      reader._internalReader._primaryView._iframeWindow.PDFViewerApplication
        .pdfViewer.currentScaleValue,
      "page-width",
    );
  } finally {
    uninstallPdfDefaultZoomBehavior();
    (globalThis as Record<string, unknown>).Zotero = originalZotero;
    globalThis.setTimeout = originalSetTimeout;
  }
});

function createDeferred<T = any>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

function createPdfReader() {
  return {
    _internalReader: {
      _primaryView: {
        initializedPromise: Promise.resolve(),
        _iframeWindow: {
          PDFViewerApplication: {
            pdfViewer: {
              currentScaleValue: "auto",
              pagesPromise: new Promise(() => undefined),
            },
          },
        },
      },
    },
  };
}

function waitForMacrotask(setTimeoutImpl: typeof setTimeout) {
  return new Promise<void>((resolve) => {
    setTimeoutImpl(resolve, 0);
  });
}

const noopSetTimeout = (() => 0) as unknown as typeof setTimeout;
