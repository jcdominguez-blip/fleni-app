// Datos reales de las planillas FLENI (Kinesiología).
// RANGOS DE PUNTAJE PROVISORIOS — a confirmar con el equipo:
//   COVS 1-7, ABS 1-4, AM-PAC 1-4, Berg 0-4, FGA 0-3, HIMAT 0-5.
// `mejorSube`: si un puntaje más alto es MEJOR (true) o PEOR (false, ej. ABS = agitación).

export const COVS = [
  "Rolar derecha", "Rolar izquierda", "Supino hasta sentarse", "Balance en sedestación",
  "Transferencia horizontal", "Transferencia vertical", "Marcha", "Marcha usando dispositivo",
  "Marcha – resistencia", "Marcha – velocidad", "Silla de ruedas", "Función MS derecho", "Función MS izquierdo",
];

export const ABS = [
  "Poca capacidad de atención, fácil distracción, incapacidad para concentrarse",
  "Impulsivo, impaciente, con baja tolerancia al dolor o la frustración",
  "Poco cooperativo, resistente al cuidado, exigente",
  "Violencia o amenaza de violencia hacia personas o propiedades",
  "Ira explosiva y/o impredecible",
  "Mecerse, frotarse, gemir u otro comportamiento de autoestimulación",
  "Tirar de tubos, restricciones, etc",
  "Vaga por las áreas de tratamiento",
  "Inquietud, paseos, movimiento excesivo",
  "Conductas repetitivas, motoras y/o verbales",
  "Hablar rápido, en voz alta o en exceso",
  "Cambios bruscos de humor",
  "Llanto y/o risa fácilmente iniciados o excesivos",
  "Autoagresión, física y/o verbal",
];

export const AMPAC = [
  "Darse vuelta en la cama (incluso ajustar la ropa de cama, sábanas y mantas)",
  "Sentarse y levantarse de una silla con apoyabrazos (silla de ruedas, inodoro, cama)",
  "Pasar de acostado boca arriba hacia sentado al borde de la cama",
  "Moverse hacia y desde una cama a una silla (incluida la silla de ruedas)",
  "Caminar en la habitación del hospital",
  "Subir 3-5 escalones con baranda",
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

export const HIMAT = [
  "Caminar", "Caminar p/atrás", "Caminar puntas de pie", "Caminar obstáculo", "Correr",
  "Avanzar saltando", "Saltar en un pie", "Dar un salto +", "Dar un salto -",
  "Subir escalera dep", "Subir escaleras ind", "Bajar escaleras dep", "Bajar escaleras ind",
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

// Mediciones funcionales (no son escalas de puntaje por ítem):
// valores libres que se registran por evaluación. [clave, etiqueta, tipo, opciones?]
export const MEDICION = [
  ["nivelRLA", "Nivel de RLA", "text"],
  ["test10Comoda", "Test 10 mts. Vel Cómoda (seg)", "number"],
  ["test10Rapida", "Test 10 mts. Vel Rápida (seg)", "number"],
  ["test6min", "Test de 6 minutos (m)", "number"],
  ["sot", "SOT", "number"],
  ["sillaRuedas", "Silla de ruedas", "select", ["", "Sí", "No"]],
];

export const SCALES = {
  covs:  { key: "covs",  labels: COVS,  min: 1, max: 7, name: "COVS",       nota: "1–7 por ítem · a confirmar", mejorSube: true },
  abs:   { key: "abs",   labels: ABS,   min: 1, max: 4, name: "ABS",        nota: "1–4 por ítem · más alto = más agitación", mejorSube: false },
  ampac: { key: "ampac", labels: AMPAC, min: 1, max: 4, name: "AM-PAC",     nota: "1–4 por ítem · a confirmar", mejorSube: true },
  bbs:   { key: "bbs",   labels: BBS,   min: 0, max: 4, name: "Berg (BBS)", nota: "0–4 por ítem · máx 56", mejorSube: true },
  fga:   { key: "fga",   labels: FGA,   min: 0, max: 3, name: "FGA",        nota: "0–3 por ítem · máx 30", mejorSube: true },
  himat: { key: "himat", labels: HIMAT, min: 0, max: 5, name: "HIMAT",      nota: "0–5 por ítem · a confirmar", mejorSube: true },
};

// Orden de las escalas en la app y el Excel.
export const SCALE_KEYS = ["covs", "abs", "ampac", "bbs", "fga", "himat"];
