import React, { useState, useEffect } from "react";
import { generarArchivo, puedeCompartirArchivo, descargarBlob, compartirArchivoNativo } from "./exportar.js";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

// Modal de compartir el Excel, adaptado al dispositivo.
// - Celular: menú nativo (adjunta el archivo; ahí se elige WhatsApp / Mail).
// - Computadora: descarga el Excel y abre WhatsApp Web / el mail para adjuntarlo.
export default function ShareModal({ actual, historial, onClose }) {
  const [arch, setArch] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [puede, setPuede] = useState(false);
  const [guia, setGuia] = useState("");

  useEffect(() => {
    let vivo = true;
    generarArchivo(actual, historial)
      .then((a) => {
        if (!vivo) return;
        setArch(a);
        setPuede(puedeCompartirArchivo(a.file));
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nombrePac = actual?.datos?.apellidoNombre || "paciente";
  const asunto = `Evaluación kinésica — ${nombrePac}`;
  const cuerpo = `Adjunto la evaluación kinésica de ${nombrePac} (se exportó en Excel).`;

  const compartir = async () => {
    const r = await compartirArchivoNativo(arch.file, nombrePac);
    if (r === "ok") onClose();
    else if (r === "unsupported") setGuia("No se pudo abrir el menú de compartir. Descargá el Excel y adjuntalo manualmente.");
  };
  const descargar = () => { descargarBlob(arch.blob, arch.nombre); setGuia("descarga"); };
  const porWhatsApp = () => {
    descargarBlob(arch.blob, arch.nombre);
    window.open("https://web.whatsapp.com/", "_blank", "noopener");
    setGuia("wa");
  };
  const porMail = () => {
    descargarBlob(arch.blob, arch.nombre);
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setGuia("mail");
  };

  const guiaTxt = {
    descarga: "Listo, descargamos el Excel. Adjuntalo donde quieras enviarlo.",
    wa: "Descargamos el Excel y abrimos WhatsApp. Adjuntá el archivo en la conversación.",
    mail: "Descargamos el Excel y abrimos tu mail. Adjuntá el archivo antes de enviar.",
  }[guia];

  return (
    <div className="modal-ov" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="modal-card">
        <button className="modal-x" onClick={onClose} aria-label="Cerrar"><Mi name="close" /></button>
        <div className="modal-icon"><Mi name="ios_share" /></div>
        <h2 id="share-title">Compartir evaluación</h2>
        <p className="modal-sub">De <b>{nombrePac}</b> · se envía como Excel (.xlsx).</p>

        {cargando ? (
          <p className="share-hint" style={{ textAlign: "center" }}>Generando el Excel…</p>
        ) : puede ? (
          <>
            <div className="share-actions">
              <button className="btn solid" onClick={compartir}><Mi name="ios_share" />Compartir por WhatsApp o Mail</button>
              <button className="btn ghost" onClick={descargar}><Mi name="download" />Descargar .xlsx</button>
            </div>
            <p className="share-hint">Se abre el menú del teléfono: elegí <b>WhatsApp</b> o <b>Mail</b> y la evaluación va con el Excel adjunto.</p>
          </>
        ) : (
          <>
            <div className="share-actions">
              <button className="btn accent" onClick={porWhatsApp}><Mi name="chat" />Enviar por WhatsApp</button>
              <button className="btn solid" onClick={porMail}><Mi name="mail" />Enviar por Mail</button>
              <button className="btn ghost" onClick={descargar}><Mi name="download" />Solo descargar .xlsx</button>
            </div>
            <p className="share-hint">
              {guiaTxt || "En computadora el Excel no se adjunta solo: descargamos el archivo y abrimos la app para que lo adjuntes en un paso."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
