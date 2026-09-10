import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { DATOS, SCALES, SCALE_KEYS, COVS, BBS, FGA } from "./scales.js";

// Paleta (ARGB para ExcelJS)
const C = {
  blue: "FF0069FF",
  blueSoft: "FFE6F0FF",
  green: "FF00DA89",
  greenSoft: "FFE4FAF1",
  ink: "FF1C2024",
  muted: "FF667085",
  line: "FFE6E8EB",
  surface: "FFF4F6F8",
  white: "FFFFFFFF",
};
const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const thin = { style: "thin", color: { argb: C.line } };
const borderAll = { top: thin, left: thin, bottom: thin, right: thin };

// Colores para series por fecha (hasta 6, luego cicla)
const SERIE = ["#0069FF", "#00A56A", "#C77700", "#7A5AF8", "#E5484D", "#0BA5C1"];

export const maxEscala = (key) => SCALES[key].labels.length * SCALES[key].max;
const totalsDe = (rec) =>
  Object.fromEntries(SCALE_KEYS.map((k) => [k, (rec[k] || []).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0)]));
const fechaDe = (rec) => (rec?.datos?.fechaEval || "").trim();

// Une historial + evaluación actual: reemplaza si comparten fecha, si no agrega.
// Devuelve la lista ordenada por fecha (las sin fecha, al final).
export function mergeRegistros(historial, actual) {
  const out = [...(historial || [])];
  const fa = fechaDe(actual);
  const idx = out.findIndex((r) => fechaDe(r) && fechaDe(r) === fa);
  if (idx >= 0) out[idx] = actual;
  else out.push(actual);
  return out.sort((a, b) => {
    const x = fechaDe(a), y = fechaDe(b);
    if (!x) return 1;
    if (!y) return -1;
    return x.localeCompare(y);
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Construye el .xlsx con estilos (ExcelJS). Devuelve un ArrayBuffer.
export async function construirWorkbookBuffer(datos, state, totals, historial = []) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fleni App";
  wb.created = new Date();

  const actual = { datos, covs: state.covs, bbs: state.bbs, fga: state.fga, totals };
  const registros = mergeRegistros(historial, actual);

  // ── Hoja Evaluación (la evaluación actual) ────────────────────────
  const ws = wb.addWorksheet("Evaluación", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 46 }, { width: 16 }, { width: 16 }];

  const titulo = ws.addRow(["Evaluación kinésica — FLENI"]);
  ws.mergeCells(titulo.number, 1, titulo.number, 3);
  titulo.height = 30;
  titulo.getCell(1).font = { name: "Arial", bold: true, size: 16, color: { argb: C.white } };
  titulo.getCell(1).fill = fill(C.blue);
  titulo.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const sub = ws.addRow([`Kinesiología · Prototipo · Fecha: ${datos.fechaEval || "—"}`]);
  ws.mergeCells(sub.number, 1, sub.number, 3);
  sub.getCell(1).font = { name: "Arial", size: 10, italic: true, color: { argb: C.muted } };
  sub.getCell(1).alignment = { indent: 1 };
  ws.addRow([]);

  const seccion = (texto, argbText = C.blue, argbFill = C.blueSoft) => {
    const r = ws.addRow([texto]);
    ws.mergeCells(r.number, 1, r.number, 3);
    r.getCell(1).font = { name: "Arial", bold: true, size: 11, color: { argb: argbText } };
    r.getCell(1).fill = fill(argbFill);
    r.getCell(1).alignment = { vertical: "middle", indent: 1 };
    r.height = 20;
  };

  seccion("DATOS DEL PACIENTE", C.ink, C.surface);
  DATOS.forEach(([k, l]) => {
    const r = ws.addRow([l, datos[k] ?? ""]);
    r.getCell(1).font = { name: "Arial", size: 10, color: { argb: C.muted } };
    r.getCell(2).font = { name: "Arial", size: 10, bold: true, color: { argb: C.ink } };
    r.getCell(1).border = borderAll;
    r.getCell(2).border = borderAll;
  });
  ws.addRow([]);

  SCALE_KEYS.forEach((key) => {
    const s = SCALES[key];
    seccion(`${s.name.toUpperCase()}  ·  máx ${maxEscala(key)}`);
    const head = ws.addRow(["Ítem", "Puntaje"]);
    head.getCell(1).font = { name: "Arial", bold: true, size: 9, color: { argb: C.muted } };
    head.getCell(2).font = { name: "Arial", bold: true, size: 9, color: { argb: C.muted } };
    head.getCell(2).alignment = { horizontal: "center" };
    s.labels.forEach((l, i) => {
      const r = ws.addRow([`${i + 1}. ${l}`, state[key][i]]);
      r.getCell(1).font = { name: "Arial", size: 10, color: { argb: C.ink } };
      r.getCell(2).font = { name: "Arial", size: 10, color: { argb: C.ink } };
      r.getCell(2).alignment = { horizontal: "center" };
      r.getCell(1).border = borderAll;
      r.getCell(2).border = borderAll;
      if (i % 2 === 1) { r.getCell(1).fill = fill(C.surface); r.getCell(2).fill = fill(C.surface); }
    });
    const tot = ws.addRow([`TOTAL ${s.name.toUpperCase()}`, totals[key]]);
    tot.getCell(1).font = { name: "Arial", bold: true, size: 10, color: { argb: C.blue } };
    tot.getCell(2).font = { name: "Arial", bold: true, size: 12, color: { argb: C.blue } };
    tot.getCell(2).alignment = { horizontal: "center" };
    tot.getCell(1).fill = fill(C.blueSoft);
    tot.getCell(2).fill = fill(C.blueSoft);
    ws.addRow([]);
  });

  // ── Hoja Registro (una fila por evaluación/fecha; fuente para reimportar) ──
  const wr = wb.addWorksheet("Registro");
  const headers = [
    ...DATOS.map((d) => d[0]),
    ...COVS.map((_, i) => `covs_${i + 1}`), "total_covs",
    ...BBS.map((_, i) => `bbs_${i + 1}`), "total_bbs",
    ...FGA.map((_, i) => `fga_${i + 1}`), "total_fga",
  ];
  const hr = wr.addRow(headers);
  hr.font = { name: "Arial", bold: true, size: 9, color: { argb: C.white } };
  hr.eachCell((cell) => { cell.fill = fill(C.blue); });
  registros.forEach((r) => {
    const t = r.totals || totalsDe(r);
    wr.addRow([
      ...DATOS.map((d) => r.datos[d[0]]),
      ...r.covs, t.covs,
      ...r.bbs, t.bbs,
      ...r.fga, t.fga,
    ]);
  });
  wr.columns.forEach((col) => { col.width = 12; });

  // ── Hoja Gráfico (comparativa por fecha) ──────────────────────────
  const png = dibujarComparativaPNG(registros);
  if (png) {
    const wg = wb.addWorksheet("Gráfico", { views: [{ showGridLines: false }] });
    const t = wg.addRow([registros.length > 1 ? "Progreso por escala (comparativa)" : "Puntaje por escala"]);
    t.getCell(1).font = { name: "Arial", bold: true, size: 14, color: { argb: C.ink } };
    const imgId = wb.addImage({ base64: png, extension: "png" });
    wg.addImage(imgId, { tl: { col: 0.2, row: 2.2 }, ext: { width: 760, height: 400 } });
  }

  return wb.xlsx.writeBuffer();
}

// Dibuja barras agrupadas por escala, una barra por fecha (altura = % del máximo).
function dibujarComparativaPNG(registros) {
  if (typeof document === "undefined") return null;
  const W = 760, H = 400, s = 2;
  const cv = document.createElement("canvas");
  cv.width = W * s; cv.height = H * s;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.scale(s, s);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);

  const pad = { l: 44, r: 20, t: 20, b: 64 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const fechas = registros.map((r) => (r.datos.fechaEval || "s/f"));

  // Grilla + eje % (0/50/100)
  ctx.strokeStyle = "#E6E8EB"; ctx.fillStyle = "#667085";
  ctx.font = "11px Arial"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  [0, 0.5, 1].forEach((f) => {
    const y = pad.t + plotH - plotH * f;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
    ctx.fillText(f === 0 ? "0" : `${f * 100}%`, pad.l - 8, y);
  });

  const groupW = plotW / SCALE_KEYS.length;
  const n = registros.length;
  const barW = Math.min(40, (groupW * 0.7) / n);
  const innerGap = 4;
  const clusterW = n * barW + (n - 1) * innerGap;

  SCALE_KEYS.forEach((k, gi) => {
    const gx = pad.l + groupW * gi + groupW / 2;
    const max = maxEscala(k);
    registros.forEach((r, ri) => {
      const t = (r.totals || totalsDe(r))[k] || 0;
      const h = plotH * Math.max(0, Math.min(1, t / max));
      const x = gx - clusterW / 2 + ri * (barW + innerGap);
      ctx.fillStyle = SERIE[ri % SERIE.length];
      ctx.fillRect(x, pad.t + plotH - h, barW, h);
      ctx.fillStyle = "#1C2024"; ctx.font = "bold 11px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(String(t), x + barW / 2, pad.t + plotH - h - 2);
    });
    ctx.fillStyle = "#667085"; ctx.font = "12px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(SCALES[k].name, gx, pad.t + plotH + 8);
  });

  // Leyenda de fechas
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "11px Arial";
  let lx = pad.l;
  const ly = H - 20;
  fechas.forEach((f, i) => {
    ctx.fillStyle = SERIE[i % SERIE.length]; ctx.fillRect(lx, ly - 6, 12, 12);
    ctx.fillStyle = "#667085"; ctx.fillText(f, lx + 18, ly);
    lx += 18 + ctx.measureText(f).width + 22;
  });
  ctx.fillStyle = "#9AA4B2"; ctx.font = "italic 10px Arial"; ctx.textAlign = "right";
  ctx.fillText("altura = % del máximo de cada escala", W - pad.r, ly);

  return cv.toDataURL("image/png").split(",")[1];
}

// Lee un .xlsx exportado por la app (hoja "Registro") y devuelve TODAS las
// evaluaciones (una por fila) como registros {datos, covs, bbs, fga, totals}.
export async function importarExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets["Registro"];
  if (!ws) {
    throw new Error("El archivo no tiene la hoja 'Registro'. Subí un .xlsx exportado por la app.");
  }
  const filas = XLSX.utils.sheet_to_json(ws, { defval: "" });
  if (!filas.length) throw new Error("La hoja 'Registro' está vacía.");

  const leerEscala = (rec, key, labels) =>
    labels.map((_, i) => {
      const v = rec[`${key}_${i + 1}`];
      if (v === "" || v == null) return "";
      const nn = Number(v);
      return Number.isFinite(nn) ? nn : "";
    });

  const registros = filas.map((rec) => {
    const datos = Object.fromEntries(
      DATOS.map(([k]) => [k, rec[k] != null && rec[k] !== "" ? String(rec[k]) : ""])
    );
    const covs = leerEscala(rec, "covs", COVS);
    const bbs = leerEscala(rec, "bbs", BBS);
    const fga = leerEscala(rec, "fga", FGA);
    const r = { datos, covs, bbs, fga };
    r.totals = totalsDe(r);
    return r;
  });

  return { registros };
}

export function nombreArchivo(datos) {
  const base = (datos.apellidoNombre || "paciente").replace(/[^\w]+/g, "_");
  const fecha = datos.fechaEval || new Date().toISOString().slice(0, 10);
  return `evaluacion_${base}_${fecha}.xlsx`;
}

async function generarBlob(datos, state, totals, historial) {
  const buffer = await construirWorkbookBuffer(datos, state, totals, historial);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function descargarExcel(datos, state, totals, historial = []) {
  const blob = await generarBlob(datos, state, totals, historial);
  const nombre = nombreArchivo(datos);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function compartirExcel(datos, state, totals, historial = []) {
  const blob = await generarBlob(datos, state, totals, historial);
  const nombre = nombreArchivo(datos);
  const file = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Evaluación kinésica", text: `Evaluación — ${datos.apellidoNombre || "paciente"}` });
      return true;
    } catch (err) {
      if (err && err.name === "AbortError") return false;
    }
  }
  await descargarExcel(datos, state, totals, historial);
  return false;
}
