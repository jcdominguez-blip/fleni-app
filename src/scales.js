// Datos reales de las planillas FLENI (Kinesiología).
// Rangos de puntaje provisorios: Berg (0-4) y FGA (0-3) son estándar;
// COVS (1-7) queda A CONFIRMAR con el equipo (pregunta 11 del cuestionario).

export const COVS = [
  "Rolar derecha", "Rolar izquierda", "Supino hasta sentarse", "Balance en sedestación",
  "Transferencia horizontal", "Transferencia vertical", "Marcha", "Marcha usando dispositivo",
  "Marcha – resistencia", "Marcha – velocidad", "Silla de ruedas", "Función MS derecho", "Función MS izquierdo",
];

export const BBS = [
  "Sentado sin soporte", "Sentado a parado", "Parado sin soporte", "Parado con ojos cerrados",
  "Parado con pies juntos", "Alcance anterior", "Levantar un objeto", "Girar para mirar detrás",
  "Giro 360 grados", "Ubicar pies en un escalón", "Pie delante del otro", "Pararse en una pierna",
  "Parado a sentado", "Transferencias",
];

export const FGA = [
  "Marcha 6 metros", "Marcha con cambio de velocidad", "Marcha con giros de cabeza horizontal",
  "Marcha con cabeza arriba/abajo", "Marcha con pivot", "Marcha con obstáculo", "Marcha en tándem",
  "Marcha con ojos cerrados", "Marcha hacia atrás", "Escaleras",
];

// [clave, etiqueta, tipo, opciones?]
export const DATOS = [
  ["apellidoNombre", "Apellido y nombre", "text"],
  ["hc", "N° HC", "text"],
  ["sexo", "Sexo", "select", ["", "F", "M"]],
  ["edad", "Edad", "number"],
  ["etiologia", "Etiología", "text"],
  ["causa", "Causa", "text"],
  ["fechaLesion", "Fecha de lesión", "date"],
  ["fechaIngreso", "Fecha de ingreso", "date"],
  ["fechaEval", "Fecha de evaluación", "date"],
  ["evaluador", "Evaluador/a", "text"],
  ["dolor", "Dolor", "select", ["", "Sí", "No"]],
  ["dolorEscala", "Dolor (0–10)", "number"],
];

export const SCALES = {
  covs: { key: "covs", labels: COVS, min: 1, max: 7, name: "COVS", nota: "escala por ítem a confirmar" },
  bbs:  { key: "bbs",  labels: BBS,  min: 0, max: 4, name: "Berg (BBS)", nota: "0–4 por ítem · máx 56" },
  fga:  { key: "fga",  labels: FGA,  min: 0, max: 3, name: "FGA", nota: "0–3 por ítem · máx 30" },
};

export const SCALE_KEYS = ["covs", "bbs", "fga"];
