import * as XLSX from "xlsx";
import { DATOS, SCALES, SCALE_KEYS, COVS, BBS, FGA } from "./scales.js";

// Construye el workbook con dos hojas:
//  - "Evaluación": legible, como la planilla en papel
//  - "Registro": una fila por evaluación, estructurada para importar a una base
export function construirWorkbook(datos, state, totals) {
  const wb = XLSX.utils.book_new();

  // Hoja legible
  const R = [];
  R.push(["EVALUACIÓN KINÉSICA — PROTOTIPO", "", "FLENI · Kinesiología"]);
  R.push([]);
  R.push(["DATOS DEL PACIENTE"]);
  DATOS.forEach(([k, l]) => R.push([l, datos[k]]));
  R.push([]);
  SCALE_KEYS.forEach((key) => {
    const s = SCALES[key];
    R.push([s.name.toUpperCase(), "Puntaje"]);
    s.labels.forEach((l, i) => R.push([`${i + 1}. ${l}`, state[key][i]]));
    R.push([`TOTAL ${s.name.toUpperCase()}`, totals[key]]);
    R.push([]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(R);
  ws1["!cols"] = [{ wch: 42 }, { wch: 14 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Evaluación");

  // Hoja estructurada
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
  const ws2 = XLSX.utils.aoa_to_sheet([headers, row]);
  XLSX.utils.book_append_sheet(wb, ws2, "Registro");

  return wb;
}

export function nombreArchivo(datos) {
  const base = (datos.apellidoNombre || "paciente").replace(/[^\w]+/g, "_");
  const fecha = datos.fechaEval || new Date().toISOString().slice(0, 10);
  return `evaluacion_${base}_${fecha}.xlsx`;
}

// Genera el .xlsx como Blob (para compartir o descargar sin duplicar lógica)
function workbookABlob(wb) {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// Descarga clásica (desktop y fallback en mobile)
export function descargarExcel(datos, state, totals) {
  const wb = construirWorkbook(datos, state, totals);
  const blob = workbookABlob(wb);
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
  const wb = construirWorkbook(datos, state, totals);
  const blob = workbookABlob(wb);
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
      // El usuario canceló el diálogo: no es un error real.
      if (err && err.name === "AbortError") return false;
      // Cualquier otra falla: caemos a descarga.
    }
  }
  descargarExcel(datos, state, totals);
  return false;
}
