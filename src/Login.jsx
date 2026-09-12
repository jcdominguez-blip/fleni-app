import React, { useState } from "react";
import logo from "../img/logo_fleniapp_color.svg";
import ilu from "../img/ilustracion-usuario.svg";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Credenciales del prototipo (NO es seguridad real: viven en el cliente).
const USUARIO = "Kinefleni2026";
const CLAVE = "Appfleni2026";

export default function Login({ onSuccess }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (enviando) return;
    if (u.trim() === USUARIO && p === CLAVE) {
      setError(false);
      setEnviando(true);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img className="login-logo" src={logo} alt="Fleni App" />
        <img className="login-ilu" src={ilu} alt="" />

        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-sub">
          Accedé al portal de planillas de manera <b>rápida y segura</b>
        </p>

        <div className="login-fields">
          <div className="login-field">
            <Mi name="person" className="login-ic" />
            <input
              className={"login-input has-ic" + (error ? " err" : "")}
              type="text"
              placeholder="Usuario"
              value={u}
              autoComplete="username"
              autoCapitalize="none"
              onChange={(e) => { setU(e.target.value); setError(false); }}
            />
          </div>
          <div className="login-field">
            <Mi name="lock" className="login-ic" />
            <input
              className={"login-input has-ic has-tr" + (error ? " err" : "")}
              type={verClave ? "text" : "password"}
              placeholder="Contraseña"
              value={p}
              autoComplete="current-password"
              onChange={(e) => { setP(e.target.value); setError(false); }}
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={verClave}
            >
              <Mi name={verClave ? "visibility_off" : "visibility"} />
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <Mi name="error" className="sm" />
            Usuario o contraseña incorrectos. Revisá los datos e intentá de nuevo.
          </div>
        )}

        <button className="btn solid login-btn" type="submit" disabled={enviando}>
          {enviando ? <><Mi name="check" />Ingresando…</> : "Ingresar"}
        </button>

        <p className="login-legal">
          Toda información de salud es confidencial. Su divulgación no autorizada está prohibida y protegida bajo las{" "}
          <b>Leyes Nacionales N° 26.529 y N° 25.326.</b>
        </p>
      </form>
    </div>
  );
}
