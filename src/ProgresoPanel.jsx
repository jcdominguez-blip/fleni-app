import React from "react";
import { SCALES, SCALE_KEYS } from "./scales.js";
import { maxEscala } from "./exportar.js";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Comparación del progreso del paciente entre fechas de evaluación.
// registros: lista ordenada por fecha de { datos, totals, ... }
export default function ProgresoPanel({ registros, tieneHistorial, onImportar }) {
  if (!tieneHistorial) {
    return (
      <div className="prog-empty">
        <Mi name="trending_up" />
        <h3>Todavía no hay con qué comparar</h3>
        <p>
          Importá una planilla anterior del paciente (ej. la de un mes previo) y cargá la nueva medición.
          Acá vas a ver la evolución de cada escala entre fechas, y el Excel incluirá el gráfico comparativo.
        </p>
        <button className="btn solid" onClick={onImportar}><Mi name="upload_file" />Cargar planilla anterior</button>
      </div>
    );
  }

  const fecha = (r) => r.datos.fechaEval || "s/f";

  return (
    <div className="prog">
      <p className="prog-intro">
        Comparativa entre <b>{registros.length}</b> evaluaciones. La barra muestra el puntaje sobre el máximo de cada
        escala; el chip indica la variación entre la primera y la última fecha.
      </p>

      {SCALE_KEYS.map((k) => {
        const max = maxEscala(k);
        const serie = registros.map((r) => ({ f: fecha(r), val: (r.totals || {})[k] || 0 }));
        const first = serie[0].val;
        const last = serie[serie.length - 1].val;
        const delta = last - first;
        // La dirección de "mejoría" depende de la escala (ej. ABS: más = peor)
        const mejorSube = SCALES[k].mejorSube !== false;
        const mejoro = delta === 0 ? 0 : (mejorSube ? (delta > 0 ? 1 : -1) : (delta < 0 ? 1 : -1));
        const dv = mejoro > 0 ? "success" : mejoro < 0 ? "warning" : "default";
        const di = delta > 0 ? "trending_up" : delta < 0 ? "trending_down" : "trending_flat";

        return (
          <div key={k} className="prog-card">
            <div className="prog-head">
              <span className="prog-name">{SCALES[k].name}</span>
              {serie.length > 1 && (
                <span className={`tag tag--${dv}`}>
                  <Mi name={di} />
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
              <span className="prog-max">máx {max}</span>
            </div>
            <div className="prog-bars">
              {serie.map((s, i) => {
                const pct = Math.max(0, Math.min(100, (s.val / max) * 100));
                const esUltima = i === serie.length - 1;
                return (
                  <div key={i} className="prog-row">
                    <span className="prog-fecha">{s.f}</span>
                    <div className="prog-track">
                      <span
                        className={"prog-fill" + (esUltima ? " last" : "")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="prog-val">{s.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
