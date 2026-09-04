# Evaluación kinésica digital — FLENI (prototipo)

Prototipo de captura digital de evaluaciones kinésicas para testear con el equipo.
React + Vite. Sin backend: exporta a Excel (.xlsx) y comparte por el menú nativo del celular.

> ⚠️ Prototipo de validación de usabilidad. Rangos de puntaje provisorios
> (a confirmar con Kinesiología). **No usar con datos reales de pacientes.**

## Correr en local

Requiere Node 18+.

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (ej. `http://localhost:5173`).

## Estructura

```
src/
  App.jsx        · pantalla principal (formulario + puntajes en vivo)
  App.css        · estilos (mobile-first)
  scales.js      · datos de las escalas y campos del paciente (COVS, Berg, FGA)
  exportar.js    · genera el .xlsx y maneja compartir/descargar
  main.jsx       · punto de entrada
```

Para sumar la **evaluación inicial (Área TCA)**: agregar sus campos en `scales.js`
y una pestaña nueva en `App.jsx`. La lógica de export ya toma todo desde `scales.js`.

## Exportación

- **Compartir**: usa la Web Share API (celular) → abre Mail / WhatsApp / Drive con el Excel adjunto.
  Si el dispositivo no lo soporta, cae automáticamente a descarga.
- **Descargar**: guarda el `.xlsx` directo.

El Excel tiene dos hojas: `Evaluación` (legible, como la planilla) y
`Registro` (una fila por evaluación, estructurada para importar a una base).

## Publicar para que lo prueben los kinesiólogos (Vercel, gratis)

1. Subir el proyecto a un repositorio de **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Prototipo evaluación kinésica FLENI"
   git branch -M main
   git remote add origin https://github.com/USUARIO/fleni-eval.git
   git push -u origin main
   ```
2. Entrar a **vercel.com**, iniciar sesión con GitHub e importar el repo.
3. Vercel detecta Vite solo. Dejar todo por defecto y **Deploy**.
4. Queda una URL pública (ej. `fleni-eval.vercel.app`) → mandarla por WhatsApp.
   En el celular se puede "Agregar a pantalla de inicio" y queda con ícono como una app.

> El envío automático por mail (sin depender del menú del teléfono) requiere un
> backend con un servicio de correo. Queda para la fase de producto.
