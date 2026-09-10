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

const maxEscala = (key) => SCALES[key].labels.length * SCALES[key].max;

// ───────────────────────────────────────────────────────────────────────────
// Construye el .xlsx con estilos (ExcelJS). Devuelve un ArrayBuffer.
//  - "Evaluación": legible y con formato, como la planilla
//  - "Registro": una fila estructurada (fuente de verdad para reimportar)
//  - "Gráfico": imagen de barras Puntaje vs Máximo por escala
export async function construirWorkbookBuffer(datos, state, totals) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fleni App";
  wb.created = new Date();

  // ── Hoja Evaluación ───────────────────────────────────────────────
  const ws = wb.addWorksheet("Evaluación", {
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 46 }, { width: 16 }, { width: 16 }];

  const titulo = ws.addRow(["Evaluación kinésica — FLENI"]);
  ws.mergeCells(titulo.number, 1, titulo.number, 3);
  titulo.height = 30;
  titulo.getCell(1).font = { name: "Arial", bold: true, size: 16, color: { argb: C.white } };
  titulo.getCell(1).fill = fill(C.blue);
  titulo.getCell(1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  const sub = ws.addRow(["Kinesiología · Prototipo de evaluación digital"]);
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
    return r;
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
      if (i % 2 === 1) {
        r.getCell(1).fill = fill(C.surface);
        r.getCell(2).fill = fill(C.surface);
      }
    });

    const tot = ws.addRow([`TOTAL ${s.name.toUpperCase()}`, totals[key]]);
    tot.getCell(1).font = { name: "Arial", bold: true, size: 10, color: { argb: C.blue } };
    tot.getCell(2).font = { name: "Arial", bold: true, size: 12, color: { argb: C.blue } };
    tot.getCell(2).alignment = { horizontal: "center" };
    tot.getCell(1).fill = fill(C.blueSoft);
    tot.getCell(2).fill = fill(C.blueSoft);
    ws.addRow([]);
  });

  // ── Hoja Registro (estructurada, para reimportar) ─────────────────
  const wr = wb.addWorksheet("Registro");
  const headers = [
    ...DATOS.map((d) => d[0]),
    ...COVS.map((_, i) => `covs_${i + 1}`), "total_covs",
    ...BBS.map((_, i) => `bbs_${i + 1}`), "total_bbs",
    ...FGA.map((_, i) => `fga_${i + 1}`), "total_fga",
  ];
  const row = [
    ...DATOS.map((d) => datos[d[0]]),
    ...state.covs, totals.covs,
    ...state.bbs, totals.bbs,
    ...state.fga, totals.fga,
  ];
  const hr = wr.addRow(headers);
  hr.font = { name: "Arial", bold: true, size: 9, color: { argb: C.white } };
  hr.eachCell((cell) => { cell.fill = fill(C.blue); });
  wr.addRow(row);
  wr.columns.forEach((col) => { col.width = 12; });

  // ── Hoja Gráfico (imagen embebida) ────────────────────────────────
  const png = dibujarGraficoPNG(totals);
  if (png) {
    const wg = wb.addWorksheet("Gráfico", { views: [{ showGridLines: false }] });
    const t = wg.addRow(["Puntaje por escala"]);
    t.getCell(1).font = { name: "Arial", bold: true, size: 14, color: { argb: C.ink } };
    const imgId = wb.addImage({ base64: png, extension: "png" });
    // Ancla la imagen desde la fila 3 (col A)
    wg.addImage(imgId, { tl: { col: 0.2, row: 2.2 }, ext: { width: 720, height: 380 } });
  }

  return wb.xlsx.writeBuffer();
}

// Dibuja un gráfico de barras (Puntaje vs Máximo por escala) y devuelve PNG base64.
// Devuelve null si no hay canvas disponible (ej. entorno Node en tests).
function dibujarGraficoPNG(totals) {
  if (typeof document === "undefined") return null;
  const W = 720, H = 380, s = 2; // s: supersampling para nitidez
  const cv = document.createElement("canvas");
  cv.width = W * s; cv.height = H * s;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.scale(s, s);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  const pad = { l: 48, r: 20, t: 24, b: 54 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const datos = SCALE_KEYS.map((k) => ({
    name: SCALES[k].name,
    val: totals[k] || 0,
    max: SCALES[k].labels.length * SCALES[k].max,
  }));
  const yMax = Math.max(...datos.map((d) => d.max), 1);

  // Eje Y (0, mitad, max) + grilla
  ctx.strokeStyle = "#E6E8EB";
  ctx.fillStyle = "#667085";
  ctx.font = "11px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  [0, 0.5, 1].forEach((f) => {
    const y = pad.t + plotH - plotH * f;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
    ctx.fillText(String(Math.round(yMax * f)), pad.l - 8, y);
  });

  // Barras agrupadas: obtenido (azul) + máximo (celeste claro)
  const groupW = plotW / datos.length;
  const barW = Math.min(46, groupW * 0.28);
  datos.forEach((d, i) => {
    const cx = pad.l + groupW * i + groupW / 2;
    const hVal = plotH * (d.val / yMax);
    const hMax = plotH * (d.max / yMax);
    // máximo (fondo)
    ctx.fillStyle = "#E6F0FF";
    ctx.fillRect(cx - barW - 3, pad.t + plotH - hMax, barW, hMax);
    // obtenido
    ctx.fillStyle = "#0069FF";
    ctx.fillRect(cx + 3, pad.t + plotH - hVal, barW, hVal);
    // valor arriba del obtenido
    ctx.fillStyle = "#1C2024";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(String(d.val), cx + 3 + barW / 2, pad.t + plotH - hVal - 3);
    // etiqueta de escala
    ctx.fillStyle = "#667085";
    ctx.font = "12px Arial";
    ctx.textBaseline = "top";
    ctx.fillText(d.name, cx, pad.t + plotH + 8);
  });

  // Leyenda
  ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "11px Arial";
  ctx.fillStyle = "#0069FF"; ctx.fillRect(pad.l, H - 20, 12, 12);
  ctx.fillStyle = "#667085"; ctx.fillText("Puntaje obtenido", pad.l + 18, H - 14);
  ctx.fillStyle = "#E6F0FF"; ctx.fillRect(pad.l + 150, H - 20, 12, 12);
  ctx.fillStyle = "#667085"; ctx.fillText("Máximo posible", pad.l + 168, H - 14);

  return cv.toDataURL("image/png").split(",")[1];
}

// Lee un .xlsx exportado por la app (hoja "Registro") y reconstruye el estado
// para continuar una evaluación cargada parcialmente en otro turno/dispositivo.
export async function importarExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets["Registro"];
  if (!ws) {
    throw new Error("El archivo no tiene la hoja 'Registro'. Subí un .xlsx exportado por la app.");
  }
  const filas = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const rec = filas[0];
  if (!rec) throw new Error("La hoja 'Registro' está vacía.");

  const datos = Object.fromEntries(
    DATOS.map(([k]) => [k, rec[k] != null && rec[k] !== "" ? String(rec[k]) : ""])
  );

  const leerEscala = (key, labels) =>
    labels.map((_, i) => {
      const v = rec[`${key}_${i + 1}`];
      if (v === "" || v == null) return "";
      const n = Number(v);
      return Number.isFinite(n) ? n : "";
    });

  return {
    datos,
    covs: leerEscala("covs", COVS),
    bbs: leerEscala("bbs", BBS),
    fga: leerEscala("fga", FGA),
  };
}

export function nombreArchivo(datos) {
  const base = (datos.apellidoNombre || "paciente").replace(/[^\w]+/g, "_");
  const fecha = datos.fechaEval || new Date().toISOString().slice(0, 10);
  return `evaluacion_${base}_${fecha}.xlsx`;
}

async function generarBlob(datos, state, totals) {
  const buffer = await construirWorkbookBuffer(datos, state, totals);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// Descarga clásica (desktop y fallback en mobile)
export async function descargarExcel(datos, state, totals) {
  const blob = await generarBlob(datos, state, totals);
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

// Compartir nativo en el celular (WhatsApp / Mail / Drive) vía Web Share API.
// Devuelve true si logró compartir; si no está soportado, cae a descarga.
export async function compartirExcel(datos, state, totals) {
  const blob = await generarBlob(datos, state, totals);
  const nombre = nombreArchivo(datos);
  const file = new File([blob], nombre, { type: blob.type });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Evaluación kinésica",
        text: `Evaluación — ${datos.apellidoNombre || "paciente"}`,
      });
      return true;
    } catch (err) {
      if (err && err.name === "AbortError") return false;
    }
  }
  await descargarExcel(datos, state, totals);
  return false;
}
