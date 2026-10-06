import React, { useState, useEffect } from "react";
import { generarArchivo, puedeCompartirArchivo, descargarBlob, compartirArchivoNativo } from "./exportar.js";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

const esMobile = () =>
  typeof navigator !== "undefined" &&
  (/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (navigator.maxTouchPoints || 0) > 1);

// Modal de compartir el Excel, robusto en todo dispositivo:
// - Celular: menú nativo (adjunta el archivo). Si falla, cae a envío manual.
// - Computadora / fallback: descarga el Excel y abre WhatsApp Web / el mail para adjuntarlo.
export default function ShareModal({ actual, historial, onClose }) {
  const [arch, setArch] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [puede, setPuede] = useState(false);
  const [manual, setManual] = useState(false); // mostrar envío manual (WhatsApp/Mail)
  const [guia, setGuia] = useState("");

  useEffect(() => {
    let vivo = true;
    generarArchivo(actual, historial)
      .then((a) => {
        if (!vivo) return;
        // El menú nativo solo tiene sentido en celular (adjunta el archivo).
        // En computadora vamos directo a las opciones manuales (WhatsApp/Mail/Descargar).
        const usarNativo = puedeCompartirArchivo(a.file) && esMobile();
        setArch(a);
        setPuede(usarNativo);
        setManual(!usarNativo);
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nombrePac = actual?.datos?.apellidoNombre || "paciente";
  const asunto = `Evaluación kinésica — ${nombrePac}`;
  const cuerpo = `Adjunto la evaluación kinésica de ${nombrePac} (se exportó en Excel).`;

  // Menú nativo (celular). Si falla por cualquier motivo → descarga + envío manual.
  const compartirNativo = async () => {
    const r = await compartirArchivoNativo(arch.file, nombrePac);
    if (r === "ok") { onClose(); return; }
    if (r === "cancel") return; // el usuario cerró el menú a propósito
    // "unsupported" o error: aseguramos que algo pase
    descargarBlob(arch.blob, arch.nombre);
    setManual(true);
    setGuia("fallback");
  };

  const descargar = () => { descargarBlob(arch.blob, arch.nombre); setGuia("descarga"); };

  const porWhatsApp = () => {
    if (esMobile()) {
      // Celular: abre la app de WhatsApp y descarga el Excel para adjuntar.
      descargarBlob(arch.blob, arch.nombre);
      window.location.href = `whatsapp://send?text=${encodeURIComponent(cuerpo)}`;
    } else {
      // Desktop: abrir WhatsApp Web PRIMERO (si no, el navegador bloquea el popup),
      // y recién después descargar el Excel para adjuntarlo.
      window.open("https://web.whatsapp.com/", "_blank");
      setTimeout(() => descargarBlob(arch.blob, arch.nombre), 400);
    }
    setGuia("wa");
  };

  const porMail = () => {
    descargarBlob(arch.blob, arch.nombre);
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setGuia("mail");
  };

  const guiaTxt = {
    fallback: "No se pudo abrir el menú de compartir. Descargamos el Excel: elegí WhatsApp o Mail y adjuntalo.",
    descarga: "Listo, descargamos el Excel. Adjuntalo donde quieras enviarlo.",
    wa: "Descargamos el Excel y abrimos WhatsApp. Elegí el chat y adjuntá el archivo (📎).",
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
        ) : !manual ? (
          <>
            <div className="share-actions">
              <button className="btn solid" onClick={compartirNativo}><Mi name="ios_share" />Compartir por WhatsApp o Mail</button>
              <button className="btn ghost" onClick={descargar}><Mi name="download" />Descargar .xlsx</button>
            </div>
            <p className="share-hint">Se abre el menú del teléfono: elegí <b>WhatsApp</b> o <b>Mail</b> y la evaluación va con el Excel adjunto.</p>
            <button className="share-link" onClick={() => setManual(true)}>¿No se abre? Enviá manualmente</button>
          </>
        ) : (
          <>
            <div className="share-actions">
              <button className="btn accent" onClick={porWhatsApp}><Mi name="chat" />Enviar por WhatsApp</button>
              <button className="btn solid" onClick={porMail}><Mi name="mail" />Enviar por Mail</button>
              <button className="btn ghost" onClick={descargar}><Mi name="download" />Solo descargar .xlsx</button>
            </div>
            <p className="share-hint">
              {guiaTxt || "Descargamos el Excel y abrimos la app (WhatsApp o Mail) para que lo adjuntes en un paso. En computadora el adjunto no se puede automatizar."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
