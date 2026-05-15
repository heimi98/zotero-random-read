import {
  getDefaultPdfZoomMode,
  getDefaultPdfZoomPercent,
} from "../utils/prefs";
import {
  normalizeDefaultPdfZoomMode,
  normalizeDefaultPdfZoomPercent,
} from "./preferences-data";
import {
  resolveDefaultPdfZoomValue,
  shouldApplyDefaultPdfZoom,
} from "./random-read";

type ReaderOpen = typeof Zotero.Reader.open;
type ReaderOpenItemID = Parameters<ReaderOpen>[0];
type DefaultPdfZoomValue = ReturnType<typeof resolveDefaultPdfZoomValue>;

let originalReaderOpen: ReaderOpen | undefined;
const FORCE_PAGES_LOADED_TIMEOUT = 10000;

export function installPdfDefaultZoomBehavior() {
  if (originalReaderOpen) {
    return;
  }

  originalReaderOpen = Zotero.Reader.open.bind(Zotero.Reader) as ReaderOpen;
  Zotero.Reader.open = async function wrappedReaderOpen(
    itemID,
    location,
    options,
  ) {
    const reader = await originalReaderOpen!(itemID, location, options);
    void applyDefaultPdfZoomWhenReady(itemID, reader);
    return reader;
  } as ReaderOpen;
}

export function uninstallPdfDefaultZoomBehavior() {
  if (!originalReaderOpen) {
    return;
  }

  Zotero.Reader.open = originalReaderOpen;
  originalReaderOpen = undefined;
}

async function applyDefaultPdfZoomWhenReady(
  itemID: ReaderOpenItemID,
  reader: any,
) {
  try {
    const item = await Zotero.Items.getAsync(itemID);
    if (
      !item ||
      !reader ||
      !shouldApplyDefaultPdfZoom({
        attachmentReaderType: item.attachmentReaderType,
      })
    ) {
      return;
    }

    const pdfViewer = await waitForInitializedPdfViewer(reader);
    const zoomValue = resolveDefaultPdfZoomValue({
      mode: normalizeDefaultPdfZoomMode(getDefaultPdfZoomMode()),
      customPercent: normalizeDefaultPdfZoomPercent(getDefaultPdfZoomPercent()),
    });
    pdfViewer.currentScaleValue = zoomValue;
    void reapplyDefaultPdfZoomAfterPagesLoaded(pdfViewer, zoomValue);
  } catch (error) {
    logPdfDefaultZoomError(error);
  }
}

async function reapplyDefaultPdfZoomAfterPagesLoaded(
  pdfViewer: any,
  zoomValue: DefaultPdfZoomValue,
) {
  try {
    await Promise.race([
      pdfViewer.pagesPromise,
      new Promise((resolve) => setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT)),
    ]);
    pdfViewer.currentScaleValue = zoomValue;
  } catch (error) {
    logPdfDefaultZoomError(error);
  }
}

async function waitForInitializedPdfViewer(reader: any) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const view =
      reader?._internalReader?._primaryView ??
      reader?._internalReader?._lastView ??
      reader?._primaryView ??
      reader?._lastView;

    if (view?.initializedPromise && view?._iframeWindow?.PDFViewerApplication) {
      await view.initializedPromise;
      return view._iframeWindow.PDFViewerApplication.pdfViewer;
    }

    await Zotero.Promise.delay(25);
  }

  throw new Error("Timed out waiting for the Zotero PDF reader to initialize");
}

function logPdfDefaultZoomError(error: unknown) {
  Zotero.logError(error instanceof Error ? error : new Error(String(error)));
}
