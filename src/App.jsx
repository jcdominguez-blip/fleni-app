import React, { useState, useMemo, useEffect, useRef } from "react";
import { DATOS, SCALES, SCALE_KEYS } from "./scales.js";
import { compartirExcel, descargarExcel, importarExcel, mergeRegistros, maxEscala } from "./exportar.js";
import Splash from "./Splash.jsx";
import ProgresoPanel from "./ProgresoPanel.jsx";
import "./App.css";

const sum = (arr) => arr.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
const cnt = (arr) => arr.filter((x) => typeof x === "number").length;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const datosVacios = () => Object.fromEntries(DATOS.map((d) => [d[0], ""]));

// Icono Material Symbols (Rounded)
const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Tag de estado reutilizable (Default / Processing / Success / Warning / Error)
function Tag({ variant = "default", icon, children }) {
  return (
    <span className={`tag tag--${variant}`}>
      {icon && <Mi name={icon} />}
      {children}
    </span>
  );
}

// Estado de una escala según ítems cargados
function estadoEscala(hechos, total) {
  if (hechos === 0) return { variant: "default", icon: "remove", label: "Sin empezar" };
  if (hechos < total) return { variant: "processing", icon: "autorenew", label: "En progreso" };
  return { variant: "success", icon: "check_circle", label: "Completa" };
}

const STORAGE_KEY = "fleni-eval-progreso-v2";

// Normaliza un array guardado a la longitud esperada de la escala.
const normArr = (a, len) => {
  const base = Array(len).fill("");
  if (Array.isArray(a)) for (let i = 0; i < len; i++) base[i] = a[i] ?? "";
  return base;
};

// Lee el progreso autoguardado en este dispositivo (localStorage).
function cargarGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? d : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [guardado] = useState(cargarGuardado); // lazy: corre una sola vez
  const fileRef = useRef(null);

  const [tab, setTab] = useState("paciente");
  const [datos, setDatos] = useState(() => guardado?.datos ?? datosVacios());
  const [covs, setCovs] = useState(() => normArr(guardado?.covs, SCALES.covs.labels.length));
  const [bbs, setBbs] = useState(() => normArr(guardado?.bbs, SCALES.bbs.labels.length));
  const [fga, setFga] = useState(() => normArr(guardado?.fga, SCALES.fga.labels.length));
  // historial: evaluaciones anteriores (para comparar el progreso entre fechas)
  const [historial, setHistorial] = useState(() => (Array.isArray(guardado?.historial) ? guardado.historial : []));
  const [ultimaImportada, setUltimaImportada] = useState(null);

  const [restaurado, setRestaurado] = useState(!!guardado);
  const [aviso, setAviso] = useState("");

  const state = { covs, bbs, fga };
  const setters = { covs: setCovs, bbs: setBbs, fga: setFga };
  const totals = useMemo(() => ({ covs: sum(covs), bbs: sum(bbs), fga: sum(fga) }), [covs, bbs, fga]);
  const completa = useMemo(
    () => Object.fromEntries(SCALE_KEYS.map((k) => [k, cnt(state[k]) === SCALES[k].labels.length])),
    [covs, bbs, fga] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Registros comparables: historial + evaluación actual (unidos por fecha)
  const registros = useMemo(
    () => mergeRegistros(historial, { datos, covs, bbs, fga, totals }),
    [historial, datos, covs, bbs, fga, totals]
  );

  // Autoguardado: guarda el progreso en este dispositivo ante cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ datos, covs, bbs, fga, historial }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [datos, covs, bbs, fga, historial]);

  const setItem = (key, i, v) => {
    const n = [...state[key]];
    n[i] = v;
    setters[key](n);
  };

  const filled = cnt(covs) + cnt(bbs) + cnt(fga);
  const totalItems = SCALE_KEYS.reduce((a, k) => a + SCALES[k].labels.length, 0);

  const onCompartir = () => compartirExcel(datos, state, totals, historial);
  const onDescargar = () => descargarExcel(datos, state, totals, historial);

  const abrirImport = () => fileRef.current?.click();

  const aplicarRegistro = (r) => {
    setDatos({ ...datosVacios(), ...r.datos });
    setCovs(normArr(r.covs, SCALES.covs.labels.length));
    setBbs(normArr(r.bbs, SCALES.bbs.labels.length));
    setFga(normArr(r.fga, SCALES.fga.labels.length));
  };

  const onImportar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-subir el mismo archivo
    if (!file) return;
    try {
      const { registros: regs } = await importarExcel(file);
      const ultima = regs[regs.length - 1];
      // Todas las evaluaciones del archivo pasan al historial; se prepara una
      // NUEVA medición (datos del paciente heredados, puntajes en blanco, fecha hoy).
      setHistorial(regs);
      setDatos({ ...datosVacios(), ...ultima.datos, fechaEval: hoyISO() });
      setCovs(Array(SCALES.covs.labels.length).fill(""));
      setBbs(Array(SCALES.bbs.labels.length).fill(""));
      setFga(Array(SCALES.fga.labels.length).fill(""));
      setUltimaImportada(ultima);
      setRestaurado(false);
      const fechas = regs.map((r) => r.datos.fechaEval || "s/f").join(", ");
      setAviso(
        `Importé ${regs.length} evaluación(es) al historial (${fechas}). Cargá la nueva medición: al exportar vas a ver la comparación en la pestaña Progreso y en el Excel.`
      );
    } catch (err) {
      setAviso(err?.message || "No se pudo leer el archivo. Subí un .xlsx exportado por la app.");
    }
  };

  // Caso "turnos": en vez de una nueva medición, continuar la última evaluación importada.
  const continuarUltima = () => {
    if (!ultimaImportada) return;
    aplicarRegistro(ultimaImportada);
    setHistorial((h) => h.filter((r) => r !== ultimaImportada));
    setUltimaImportada(null);
    setAviso("Seguís editando la última evaluación importada.");
  };

  const empezarDeCero = () => {
    setDatos(datosVacios());
    setCovs(Array(SCALES.covs.labels.length).fill(""));
    setBbs(Array(SCALES.bbs.labels.length).fill(""));
    setFga(Array(SCALES.fga.labels.length).fill(""));
    setHistorial([]);
    setUltimaImportada(null);
    setRestaurado(false);
    setAviso("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="app">
      <Splash />
      <header className="bar">
        <div className="brand">Fleni<span> App</span></div>
        <div className="titles">
          <div className="eyebrow">FLENI · Kinesiología — prototipo</div>
          <h1>Evaluación kinésica digital</h1>
        </div>
        <button className="barbtn" onClick={abrirImport} title="Continuar una planilla exportada">
          <Mi name="upload_file" className="sm" />
          Importar
        </button>
        <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={onImportar} />
      </header>

      <div className="progress">
        <div className="pbar"><span style={{ width: `${(filled / totalItems) * 100}%` }} /></div>
        <div className="pnum">{filled}/{totalItems}</div>
      </div>

      {(restaurado || aviso) && (
        <div className="avisos">
          {restaurado && (
            <div className="aviso">
              <span>Recuperamos una evaluación en curso en este dispositivo.</span>
              <button onClick={empezarDeCero}><Mi name="restart_alt" className="sm" />Empezar de cero</button>
            </div>
          )}
          {aviso && (
            <div className="aviso">
              <span>{aviso}</span>
              <div className="aviso-acc">
                {ultimaImportada && (
                  <button onClick={continuarUltima}><Mi name="edit" className="sm" />Continuar la última</button>
                )}
                <button onClick={() => setAviso("")}><Mi name="close" className="sm" />OK</button>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="tabs">
        {[["paciente", "Paciente"], ["covs", "COVS"], ["bbs", "Berg"], ["fga", "FGA"], ["resumen", "Resumen"], ["progreso", "Progreso"]].map(
          ([k, l]) => (
            <button
              key={k}
              className={"tab" + (tab === k ? " on" : "") + (completa[k] ? " done" : "")}
              onClick={() => setTab(k)}
            >
              {k === "progreso" && <Mi name="trending_up" className="sm" />}
              {l}
              {SCALE_KEYS.includes(k) && <b>{completa[k] ? "✓" : totals[k]}</b>}
              {k === "progreso" && historial.length > 0 && <b>{registros.length}</b>}
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
          <ScalePanel
            scale={SCALES[tab]}
            values={state[tab]}
            total={totals[tab]}
            hechos={cnt(state[tab])}
            onSet={(i, v) => setItem(tab, i, v)}
            onCompartir={onCompartir}
            onDescargar={onDescargar}
          />
        )}

        {tab === "resumen" && (
          <div className="resumen">
            <div className="cards">
              {SCALE_KEYS.map((k) => {
                const hechos = cnt(state[k]);
                const total = SCALES[k].labels.length;
                const falta = total - hechos;
                const est = estadoEscala(hechos, total);
                return (
                  <div key={k} className={"card" + (completa[k] ? " done" : "")}>
                    <div className="card-top">
                      <span className="card-name">{SCALES[k].name}</span>
                      <Tag variant={est.variant} icon={est.icon}>{est.label}</Tag>
                    </div>
                    <div className="big">{totals[k]}</div>
                    <div className="sub">{hechos}/{total} ítems{completa[k] ? "" : ` · faltan ${falta}`}</div>
                  </div>
                );
              })}
            </div>

            <div className="exportbox">
              <div>
                <h3>Guardar / continuar esta evaluación</h3>
                <p>
                  La planilla se puede llenar por turnos. <b>Compartí</b> o <b>descargá</b> el Excel al terminar tu
                  parte; en el próximo turno, <b>Importá</b> ese archivo para seguir donde quedó.
                </p>
              </div>
              <div className="exportbtns">
                <button className="btn solid" onClick={onCompartir}><Mi name="ios_share" />Compartir Excel</button>
                <button className="btn ghost-light" onClick={onDescargar}><Mi name="download" />Descargar .xlsx</button>
                <button className="btn ghost-light" onClick={abrirImport}><Mi name="upload_file" />Importar para continuar</button>
              </div>
            </div>

            <p className="disc">
              Prototipo de validación. Rangos de puntaje provisorios (a confirmar con Kinesiología). No usar con datos
              reales de pacientes.
            </p>
          </div>
        )}

        {tab === "progreso" && (
          <ProgresoPanel registros={registros} tieneHistorial={historial.length > 0} onImportar={abrirImport} />
        )}
      </main>
    </div>
  );
}

function ScalePanel({ scale, values, total, hechos, onSet, onCompartir, onDescargar }) {
  const opts = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);
  const falta = scale.labels.length - hechos;
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

      <div className="scalefoot">
        <div className="scalefoot-txt">
          <b>¿Terminaste {scale.name}?</b>
          <span>
            Exportá la evaluación hasta acá {falta > 0 ? `(faltan ${falta} ítems de esta escala) ` : ""}
            para guardarla o pasar el turno.
          </span>
        </div>
        <div className="scalefoot-btns">
          <button className="btn solid" onClick={onCompartir}><Mi name="ios_share" />Compartir Excel</button>
          <button className="btn ghost" onClick={onDescargar}><Mi name="download" />Descargar .xlsx</button>
        </div>
      </div>
    </div>
  );
}
