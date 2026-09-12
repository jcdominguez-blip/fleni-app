import React from "react";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Modal que aparece al cargar una planilla: define si se inicia una nueva
// evaluación (ingreso/mensual, para medir progreso) o se continúa la última.
export default function EvalModal({ info, onNueva, onContinuar, onClose }) {
  const { nombre, fechas = [], ultima } = info || {};
  return (
    <div className="modal-ov" role="dialog" aria-modal="true" aria-labelledby="evalmodal-title">
      <div className="modal-card">
        <button className="modal-x" onClick={onClose} aria-label="Cerrar"><Mi name="close" /></button>

        <div className="modal-icon"><Mi name="assignment_turned_in" /></div>
        <h2 id="evalmodal-title">¿Cómo seguimos con esta planilla?</h2>
        <p className="modal-sub">
          Cargaste la planilla{nombre ? <> de <b>{nombre}</b></> : ""}
          {fechas.length > 0 && <> · {fechas.length} evaluación(es): {fechas.join(", ")}</>}.
          Elegí cómo continuar:
        </p>

        <button className="opt" onClick={onNueva}>
          <span className="opt-ic opt-ic--blue"><Mi name="add_chart" /></span>
          <span className="opt-txt">
            <b>Nueva evaluación</b>
            <span>Medición de ingreso o mensual. Guarda las anteriores para comparar el progreso.</span>
          </span>
          <Mi name="chevron_right" className="opt-arrow" />
        </button>

        <button className="opt" onClick={onContinuar}>
          <span className="opt-ic opt-ic--green"><Mi name="edit_note" /></span>
          <span className="opt-txt">
            <b>Continuar evaluación</b>
            <span>Seguí completando {ultima ? <>la del <b>{ultima}</b></> : "la última"} que quedó a medias (mismo turno).</span>
          </span>
          <Mi name="chevron_right" className="opt-arrow" />
        </button>
      </div>
    </div>
  );
}
