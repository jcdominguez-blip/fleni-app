import React, { useState, useMemo } from "react";
import { DATOS, SCALES, SCALE_KEYS } from "./scales.js";
import { compartirExcel, descargarExcel } from "./exportar.js";
import Splash from "./Splash.jsx";
import "./App.css";

const sum = (arr) => arr.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
const cnt = (arr) => arr.filter((x) => typeof x === "number").length;

export default function App() {
  const [tab, setTab] = useState("paciente");
  const [datos, setDatos] = useState(Object.fromEntries(DATOS.map((d) => [d[0], ""])));
  const [covs, setCovs] = useState(Array(SCALES.covs.labels.length).fill(""));
  const [bbs, setBbs] = useState(Array(SCALES.bbs.labels.length).fill(""));
  const [fga, setFga] = useState(Array(SCALES.fga.labels.length).fill(""));

  const state = { covs, bbs, fga };
  const setters = { covs: setCovs, bbs: setBbs, fga: setFga };
  const totals = useMemo(() => ({ covs: sum(covs), bbs: sum(bbs), fga: sum(fga) }), [covs, bbs, fga]);

  const setItem = (key, i, v) => {
    const n = [...state[key]];
    n[i] = v;
    setters[key](n);
  };

  const filled = cnt(covs) + cnt(bbs) + cnt(fga);
  const totalItems = SCALE_KEYS.reduce((a, k) => a + SCALES[k].labels.length, 0);

  const onCompartir = () => compartirExcel(datos, state, totals);
  const onDescargar = () => descargarExcel(datos, state, totals);

  return (
    <div className="app">
      <Splash />
      <header className="bar">
        <div className="brand">Fleni<span> App</span></div>
        <div className="titles">
          <div className="eyebrow">FLENI · Kinesiología — prototipo</div>
          <h1>Evaluación kinésica digital</h1>
        </div>
      </header>

      <div className="progress">
        <div className="pbar"><span style={{ width: `${(filled / totalItems) * 100}%` }} /></div>
        <div className="pnum">{filled}/{totalItems}</div>
      </div>

      <nav className="tabs">
        {[["paciente", "Paciente"], ["covs", "COVS"], ["bbs", "Berg"], ["fga", "FGA"], ["resumen", "Resumen"]].map(
          ([k, l]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              {l}
              {SCALE_KEYS.includes(k) && <b>{totals[k]}</b>}
            </button>
          )
        )}
      </nav>

      <main className="panel">
        {tab === "paciente" && (
          <div className="grid">
            {DATOS.map(([k, l, t, opts]) => (
              <label key={k} className={"field" + (k === "apellidoNombre" || k === "etiologia" ? " wide" : "")}>
                <span>{l}</span>
                {t === "select" ? (
                  <select value={datos[k]} onChange={(e) => setDatos({ ...datos, [k]: e.target.value })}>
                    {opts.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                  </select>
                ) : (
                  <input type={t} value={datos[k]} onChange={(e) => setDatos({ ...datos, [k]: e.target.value })} />
                )}
              </label>
            ))}
          </div>
        )}

        {SCALE_KEYS.includes(tab) && (
          <ScalePanel scale={SCALES[tab]} values={state[tab]} total={totals[tab]} onSet={(i, v) => setItem(tab, i, v)} />
        )}

        {tab === "resumen" && (
          <div className="resumen">
            <div className="cards">
              {SCALE_KEYS.map((k) => (
                <div key={k} className="card">
                  <div className="eyebrow">{SCALES[k].name}</div>
                  <div className="big">{totals[k]}</div>
                  <div className="sub">{cnt(state[k])}/{SCALES[k].labels.length} ítems · {SCALES[k].nota}</div>
                </div>
              ))}
            </div>

            <div className="exportbox">
              <div>
                <h3>Exportar esta evaluación</h3>
                <p>
                  <b>Compartir</b> abre el menú del teléfono (Mail, WhatsApp, Drive) con el Excel adjunto —lo más cómodo
                  en celular. <b>Descargar</b> guarda el archivo directo.
                </p>
              </div>
              <div className="exportbtns">
                <button className="btn solid" onClick={onCompartir}>Compartir Excel</button>
                <button className="btn ghost-dark" onClick={onDescargar}>Descargar .xlsx</button>
              </div>
            </div>

            <p className="disc">
              Prototipo de validación. Rangos de puntaje provisorios (a confirmar con Kinesiología). No usar con datos
              reales de pacientes.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ScalePanel({ scale, values, total, onSet }) {
  const opts = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);
  return (
    <div>
      <div className="scalehead">
        <div>
          <h3>{scale.name}</h3>
          <span className="eyebrow">{scale.nota}</span>
        </div>
        <div className="totbadge"><b>{total}</b><span>total</span></div>
      </div>
      <div className="items">
        {scale.labels.map((l, i) => (
          <div key={i} className="item">
            <div className="ilabel"><i>{i + 1}</i>{l}</div>
            <div className="score">
              {opts.map((o) => (
                <button
                  key={o}
                  className={"sbtn" + (values[i] === o ? " on" : "")}
                  onClick={() => onSet(i, values[i] === o ? "" : o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
