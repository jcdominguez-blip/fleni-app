import React from "react";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Modal de bienvenida: orienta al kinesiólogo con las dos acciones posibles.
export default function Bienvenida({ onCargar, onNueva }) {
  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <div className="welcome-icon"><Mi name="assignment" /></div>
        <h2 id="welcome-title">Bienvenido/a a Fleni App</h2>
        <p className="welcome-sub">Planillas de evaluación kinésica. Elegí cómo empezar:</p>

        <div className="welcome-actions">
          <button className="btn solid" onClick={onCargar}>
            <Mi name="upload_file" />Cargar planilla del paciente
          </button>
          <button className="btn ghost" onClick={onNueva}>
            <Mi name="note_add" />Empezar planilla nueva
          </button>
        </div>

        <p className="welcome-hint">
          <b>Cargar planilla:</b> continuá la evaluación de un paciente desde un Excel exportado antes.
          <br />
          <b>Planilla nueva:</b> empezá una evaluación desde cero.
        </p>
      </div>
    </div>
  );
}
