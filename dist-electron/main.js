import { ipcMain as d, dialog as P, nativeImage as M, app as l, BrowserWindow as _ } from "electron";
import { fileURLToPath as O } from "node:url";
import o from "node:path";
import { mkdir as y, writeFile as I } from "node:fs/promises";
const m = o.dirname(O(import.meta.url));
process.env.APP_ROOT = o.join(m, "..");
const u = process.env.VITE_DEV_SERVER_URL, F = o.join(process.env.APP_ROOT, "dist-electron"), j = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = u ? o.join(process.env.APP_ROOT, "public") : j;
let h;
function E() {
  const t = process.env.VITE_PUBLIC ?? process.env.APP_ROOT ?? m;
  h = new _({
    icon: o.join(t, "drop-resize.png"),
    webPreferences: {
      preload: o.join(m, "preload.mjs")
    }
  }), u ? h.loadURL(u) : h.loadFile(o.join(j, "index.html"));
}
d.handle("files:pick-images", async () => {
  const t = await P.showOpenDialog({
    title: "Select images",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif", "tiff", "tif"] }
    ]
  });
  return t.canceled ? [] : t.filePaths;
});
d.handle("files:pick-output-dir", async () => {
  const t = await P.showOpenDialog({
    title: "Choose output folder",
    properties: ["openDirectory", "createDirectory"]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
});
d.handle("images:resize", async (t, e) => {
  const n = [];
  for (const i of e.files)
    try {
      const r = M.createFromPath(i);
      if (r.isEmpty()) {
        n.push({
          inputPath: i,
          success: !1,
          message: "Unable to decode image data"
        });
        continue;
      }
      const c = r.getSize(), p = e.mode === "exact" ? { width: e.width, height: e.height } : N(c.width, c.height, e.width, e.height), f = r.resize({
        width: Math.max(1, p.width),
        height: Math.max(1, p.height),
        quality: "best"
      }), g = S(i, e.format), R = o.parse(i).name, w = e.outputDir && e.outputDir.trim().length > 0 ? e.outputDir : o.dirname(i);
      await y(w, { recursive: !0 });
      const T = U(e.outputNameTemplate, {
        filename: R,
        extension: g,
        width: p.width,
        height: p.height
      }), x = o.join(w, T), D = g === "jpg" || g === "jpeg" ? f.toJPEG(z(e.jpegQuality)) : f.toPNG();
      await I(x, D), n.push({
        inputPath: i,
        outputPath: x,
        success: !0
      });
    } catch (r) {
      const c = r instanceof Error ? r.message : "Unknown resize failure";
      n.push({
        inputPath: i,
        success: !1,
        message: c
      });
    }
  const s = n.filter((i) => i.success).length, a = n.length - s;
  return {
    successCount: s,
    failureCount: a,
    results: n
  };
});
function S(t, e) {
  if (e === "png")
    return "png";
  if (e === "jpeg")
    return "jpg";
  const n = o.extname(t).toLowerCase().replace(".", "");
  return n === "jpg" || n === "jpeg" ? n : "png";
}
function z(t) {
  return Math.max(1, Math.min(100, Math.round(t)));
}
function N(t, e, n, s) {
  const a = Math.max(1, n), i = Math.max(1, s);
  if (t <= 0 || e <= 0)
    return { width: a, height: i };
  const r = Math.min(a / t, i / e);
  return {
    width: Math.max(1, Math.round(t * r)),
    height: Math.max(1, Math.round(e * r))
  };
}
function U(t, e) {
  const s = (t.trim().length > 0 ? t : "{filename}-{width}x{height}.{extension}").replace(/\{filename\}/g, e.filename).replace(/\{extension\}/g, e.extension).replace(/\{width\}/g, String(e.width)).replace(/\{height\}/g, String(e.height)), a = V(s);
  return a.trim().length > 0 ? a : `${e.filename}-${e.width}x${e.height}.${e.extension}`;
}
function V(t) {
  return t.replace(/[\\/:*?"<>|]/g, "_").replace(/[\u0000-\u001f]/g, "");
}
l.on("window-all-closed", () => {
  process.platform !== "darwin" && (l.quit(), h = null);
});
l.on("activate", () => {
  _.getAllWindows().length === 0 && E();
});
l.whenReady().then(E);
export {
  F as MAIN_DIST,
  j as RENDERER_DIST,
  u as VITE_DEV_SERVER_URL
};
