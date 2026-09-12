import React, { useState, useMemo, useEffect, useRef } from "react";
import { DATOS, MEDICION, SCALES, SCALE_KEYS } from "./scales.js";
import { compartirExcel, descargarExcel, importarExcel, mergeRegistros } from "./exportar.js";
import Splash from "./Splash.jsx";
import ProgresoPanel from "./ProgresoPanel.jsx";
import Bienvenida from "./Bienvenida.jsx";
import Onboarding from "./Onboarding.jsx";
import logoFull from "../img/logo_fleniapp.svg";
import simbolo from "../img/favicon.svg";
import "./App.css";

const sum = (arr) => arr.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
const cnt = (arr) => arr.filter((x) => typeof x === "number").length;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const datosVacios = () => Object.fromEntries(DATOS.map((d) => [d[0], ""]));
const medicionVacia = () => Object.fromEntries(MEDICION.map((m) => [m[0], ""]));

// Icono Material Symbols (Rounded)
const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

function Tag({ variant = "default", icon, children }) {
  return (
    <span className={`tag tag--${variant}`}>
      {icon && <Mi name={icon} />}
      {children}
    </span>
  );
}

function estadoEscala(hechos, total) {
  if (hechos === 0) return { variant: "default", icon: "remove", label: "Sin empezar" };
  if (hechos < total) return { variant: "processing", icon: "autorenew", label: "En progreso" };
  return { variant: "success", icon: "check_circle", label: "Completa" };
}

const STORAGE_KEY = "fleni-eval-progreso-v2";

const normArr = (a, len) => {
  const base = Array(len).fill("");
  if (Array.isArray(a)) for (let i = 0; i < len; i++) base[i] = a[i] ?? "";
  return base;
};
// Construye el objeto de escalas normalizado desde una fuente (guardado o registro).
const initEscalas = (src) =>
  Object.fromEntries(SCALE_KEYS.map((k) => [k, normArr(src?.[k], SCALES[k].labels.length)]));

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

// Grilla de campos reutilizable (Paciente / Medición)
function CamposGrid({ defs, valores, onChange }) {
  return (
    <div className="grid">
      {defs.map(([k, l, t, opts]) => (
        <label key={k} className={"field" + (k === "apellidoNombre" || k === "etiologia" ? " wide" : "")}>
          <span>{l}</span>
          {t === "select" ? (
            <select value={valores[k] ?? ""} onChange={(e) => onChange(k, e.target.value)}>
              {opts.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
            </select>
          ) : (
            <input type={t} value={valores[k] ?? ""} onChange={(e) => onChange(k, e.target.value)} />
          )}
        </label>
      ))}
    </div>
  );
}

export default function App() {
  const [guardado] = useState(cargarGuardado);
  const fileRef = useRef(null);

  const [tab, setTab] = useState("paciente");
  const [datos, setDatos] = useState(() => ({ ...datosVacios(), ...(guardado?.datos || {}) }));
  const [medicion, setMedicion] = useState(() => ({ ...medicionVacia(), ...(guardado?.medicion || {}) }));
  const [escalas, setEscalas] = useState(() => initEscalas(guardado?.escalas || guardado || {}));
  const [historial, setHistorial] = useState(() => (Array.isArray(guardado?.historial) ? guardado.historial : []));
  const [ultimaImportada, setUltimaImportada] = useState(null);

  const [restaurado, setRestaurado] = useState(!!guardado);
  const [aviso, setAviso] = useState("");
  // Onboarding: se muestra una sola vez por dispositivo
  const [onboarding, setOnboarding] = useState(() => {
    try { return !localStorage.getItem("fleni-onboarding-v1"); } catch { return true; }
  });
  const cerrarOnboarding = () => {
    setOnboarding(false);
    try { localStorage.setItem("fleni-onboarding-v1", "1"); } catch { /* noop */ }
  };
  // Modal de bienvenida: solo si no hay una evaluación en curso recuperada
  const [bienvenida, setBienvenida] = useState(!guardado);
  // Navbar: el logotipo se colapsa al símbolo al hacer scroll
  const [miniLogo, setMiniLogo] = useState(false);
  useEffect(() => {
    const onScroll = () => setMiniLogo(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totals = useMemo(
    () => Object.fromEntries(SCALE_KEYS.map((k) => [k, sum(escalas[k])])),
    [escalas]
  );
  const completa = useMemo(
    () => Object.fromEntries(SCALE_KEYS.map((k) => [k, cnt(escalas[k]) === SCALES[k].labels.length])),
    [escalas]
  );

  const actual = useMemo(() => ({ datos, medicion, ...escalas, totals }), [datos, medicion, escalas, totals]);
  const registros = useMemo(() => mergeRegistros(historial, actual), [historial, actual]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ datos, medicion, escalas, historial }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [datos, medicion, escalas, historial]);

  const setItem = (key, i, v) => {
    setEscalas((prev) => {
      const arr = [...prev[key]];
      arr[i] = v;
      return { ...prev, [key]: arr };
    });
  };

  const filled = SCALE_KEYS.reduce((a, k) => a + cnt(escalas[k]), 0);
  const totalItems = SCALE_KEYS.reduce((a, k) => a + SCALES[k].labels.length, 0);

  const onCompartir = () => compartirExcel(actual, historial);
  const onDescargar = () => descargarExcel(actual, historial);
  const abrirImport = () => fileRef.current?.click();

  // Acciones del modal de bienvenida
  const bienvenidaCargar = () => { setBienvenida(false); abrirImport(); };
  const bienvenidaNueva = () => { setBienvenida(false); setTab("paciente"); };

  const aplicarRegistro = (r) => {
    setDatos({ ...datosVacios(), ...r.datos });
    setMedicion({ ...medicionVacia(), ...(r.medicion || {}) });
    setEscalas(initEscalas(r));
  };

  const onImportar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { registros: regs } = await importarExcel(file);
      const ultima = regs[regs.length - 1];
      // Todas las evaluaciones del archivo van al historial; se prepara una NUEVA medición.
      setHistorial(regs);
      setDatos({ ...datosVacios(), ...ultima.datos, fechaEval: hoyISO() });
      setMedicion(medicionVacia());
      setEscalas(initEscalas({}));
      setUltimaImportada(ultima);
      setRestaurado(false);
      const fechas = regs.map((r) => r.datos.fechaEval || "s/f").join(", ");
      setAviso(
        `Cargué ${regs.length} evaluación(es) al historial (${fechas}). Completá la nueva medición: al exportar vas a ver la comparación en Progreso y en el Excel.`
      );
    } catch (err) {
      setAviso(err?.message || "No se pudo leer el archivo. Subí un .xlsx exportado por la app.");
    }
  };

  const continuarUltima = () => {
    if (!ultimaImportada) return;
    aplicarRegistro(ultimaImportada);
    setHistorial((h) => h.filter((r) => r !== ultimaImportada));
    setUltimaImportada(null);
    setAviso("Seguís editando la última evaluación importada.");
  };

  const empezarDeCero = () => {
    setDatos(datosVacios());
    setMedicion(medicionVacia());
    setEscalas(initEscalas({}));
    setHistorial([]);
    setUltimaImportada(null);
    setRestaurado(false);
    setAviso("");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  };

  const TABS = [
    ["paciente", "Paciente"], ["covs", "COVS"], ["abs", "ABS"], ["ampac", "AM-PAC"],
    ["bbs", "Berg"], ["fga", "FGA"], ["himat", "HIMAT"], ["medicion", "Medición"],
    ["resumen", "Resumen"], ["progreso", "Progreso"],
  ];

  return (
    <div className="app">
      <Splash />
      {onboarding && <Onboarding onFinish={cerrarOnboarding} />}
      {!onboarding && bienvenida && <Bienvenida onCargar={bienvenidaCargar} onNueva={bienvenidaNueva} />}
      <header className="bar">
        <div className={"brandwrap" + (miniLogo ? " min" : "")} aria-label="Fleni App" title="Fleni App">
          <img className="logo-full" src={logoFull} alt="Fleni App" />
          <img className="logo-sym" src={simbolo} alt="" />
        </div>
        <div className="titles">
          <div className="eyebrow">FLENI · Kinesiología — prototipo</div>
          <h1>Evaluación kinésica digital</h1>
        </div>
        <button className="barbtn" onClick={abrirImport} title="Cargar una planilla exportada del paciente">
          <Mi name="upload_file" className="sm" />
          Cargar planilla
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
        {TABS.map(([k, l]) => (
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
        ))}
      </nav>

      <main className="panel">
        {tab === "paciente" && (
          <CamposGrid defs={DATOS} valores={datos} onChange={(k, v) => setDatos({ ...datos, [k]: v })} />
        )}

        {tab === "medicion" && (
          <>
            <p className="prog-intro">
              Mediciones funcionales (Nivel de RLA y pruebas de marcha). Se registran por evaluación y viajan en el Excel.
            </p>
            <CamposGrid defs={MEDICION} valores={medicion} onChange={(k, v) => setMedicion({ ...medicion, [k]: v })} />
          </>
        )}

        {SCALE_KEYS.includes(tab) && (
          <ScalePanel
            scale={SCALES[tab]}
            values={escalas[tab]}
            total={totals[tab]}
            hechos={cnt(escalas[tab])}
            onSet={(i, v) => setItem(tab, i, v)}
            onCompartir={onCompartir}
            onDescargar={onDescargar}
          />
        )}

        {tab === "resumen" && (
          <div className="resumen">
            <div className="cards">
              {SCALE_KEYS.map((k) => {
                const hechos = cnt(escalas[k]);
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
                <button className="btn ghost-light" onClick={abrirImport}><Mi name="upload_file" />Cargar planilla del paciente</button>
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
