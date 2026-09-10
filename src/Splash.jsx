import { useState, useEffect } from "react";
import logo from "../img/logo_fleniapp.svg";
import "./Splash.css";

// Pantalla de inicio: revela el logo (blanco) sobre el navy institucional
// con una animación de wipe + fade, y luego se desvanece para mostrar la app.
export default function Splash() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 700 : 1800; // cuánto se muestra antes de irse
    const fade = 550;                 // duración del fundido de salida

    const t1 = setTimeout(() => setLeaving(true), hold);
    const t2 = setTimeout(() => setGone(true), hold + fade);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={"splash" + (leaving ? " leaving" : "")} aria-hidden="true">
      <img className="splash-logo" src={logo} alt="Fleni" />
    </div>
  );
}
