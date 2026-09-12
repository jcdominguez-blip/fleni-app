import React, { useState, useRef, useEffect } from "react";
import art1 from "../img/ilustracion-01.svg";
import art2 from "../img/ilustracion-02.svg";
import art3 from "../img/ilustracion-03.svg";
import art4 from "../img/ilustracion-04.svg";
import art5 from "../img/ilustracion-05.svg";

const Mi = ({ name, className = "" }) => <span className={"mi " + className} aria-hidden="true">{name}</span>;

const SLIDES = [
  {
    img: art1,
    title: "¡Bienvenido/a!",
    body: "La app de planillas de evaluación para kinesiólogos del Fleni.",
  },
  {
    img: art2,
    title: "¿Por dónde empiezo?",
    body: "Podés cargar la planilla de un paciente para continuar su evaluación, o empezar una planilla nueva desde cero.",
  },
  {
    img: art3,
    title: "¿Cómo cargo una planilla?",
    body: "Tocá “Cargar planilla” arriba a la derecha y elegí el Excel desde tus archivos.",
  },
  {
    img: art4,
    title: "¡Cargá los datos!",
    body: "En una planilla nueva completá todos los datos. Si cargaste una ya empezada, seguís desde donde la dejaron.",
  },
  {
    img: art5,
    title: "¿Cómo exporto la planilla?",
    body: "“Compartir” la manda por WhatsApp u otro medio; “Descargar” la guarda en tu dispositivo. En ambos casos se genera un Excel.",
  },
];

export default function Onboarding({ onFinish }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const touchX = useRef(null);

  const go = (n) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));
  const next = () => (last ? onFinish() : go(i + 1));
  const back = () => go(i - 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // sin deps: usa el i actual en cada render

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -45) next();
    else if (dx > 45) back();
    touchX.current = null;
  };

  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label="Introducción a Fleni App">
      <div className="ob-top">
        {i > 0 ? (
          <button className="ob-back" onClick={back} aria-label="Anterior"><Mi name="arrow_back" /></button>
        ) : <span />}
        {!last && <button className="ob-skip" onClick={onFinish}>Saltar</button>}
      </div>

      <div className="ob-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="ob-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((s, idx) => (
            <section className="ob-slide" key={idx} aria-hidden={idx !== i}>
              <div className="ob-art"><img src={s.img} alt="" /></div>
              <div className="ob-copy">
                <h2 className="ob-title">{s.title}</h2>
                <p className="ob-body">{s.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="ob-nav">
        <div className="ob-dots">
          {SLIDES.map((_, d) => (
            <button
              key={d}
              className={"ob-dot" + (d === i ? " on" : "")}
              onClick={() => go(d)}
              aria-label={`Ir a la pantalla ${d + 1}`}
              aria-current={d === i}
            />
          ))}
        </div>
        <button className="btn solid ob-next" onClick={next}>
          {last ? "Empezar" : "Siguiente"}
          <Mi name={last ? "check" : "arrow_forward"} />
        </button>
      </div>
    </div>
  );
}
