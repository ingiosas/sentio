/* ==========================================================================
   Perfil Sensorial del Bebé/Niño Pequeño 2 — lógica de la aplicación
   ========================================================================== */

const STORAGE_KEY = "perfilSensorial2_v1";

const STEP_DEFS = [
  { key: "inicio", type: "welcome", label: "Inicio" },
  { key: "datos", type: "datos", label: "Datos del niño(a)" },
  ...SECTIONS.map((s) => ({
    key: s.key,
    type: "section",
    label: shortLabel(s.title),
    section: s,
  })),
  { key: "resultados", type: "resultados", label: "Resultados" },
  { key: "interpretacion", type: "interpretacion", label: "Guía profesional" },
];

function shortLabel(title) {
  return title.replace("Procesamiento de ", "").replace("Procesamiento ", "").replace("Respuestas de ", "");
}

let state = loadState();
let currentStepIndex = state.currentStepIndex || 0;
let toastTimer = null;

function defaultState() {
  return {
    child: {},
    answers: {},
    comments: {},
    currentStepIndex: 0,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.warn("No se pudo leer el almacenamiento local", e);
    return defaultState();
  }
}

function saveState(showToast) {
  state.currentStepIndex = currentStepIndex;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showToast) showSaveIndicator();
  } catch (e) {
    console.warn("No se pudo guardar en el almacenamiento local", e);
  }
}

/* -------------------------------------------------------------------- */
/* Utilidades                                                           */
/* -------------------------------------------------------------------- */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sumScores(ids) {
  let sum = 0;
  for (const id of ids) {
    const s = state.answers[id];
    if (typeof s === "number") sum += s;
  }
  return sum;
}

function countAnswered(ids) {
  return ids.filter((id) => typeof state.answers[id] === "number").length;
}

function classifyIndex(rangeKey, raw) {
  const { lows } = RANGES[rangeKey];
  let idx = 0;
  for (let i = 0; i < lows.length; i++) {
    if (raw >= lows[i]) idx = i;
  }
  return idx;
}

function getQuadrantResult(quad) {
  const answered = countAnswered(quad.items);
  const raw = sumScores(quad.items);
  if (answered === 0) return { answered: false, raw, level: null, label: null };
  const idx = classifyIndex(quad.key, raw);
  return { answered: true, raw, level: idx + 1, label: LABELS_5[idx] };
}

function getSectionResult(section) {
  const answered = countAnswered(section.main);
  const raw = sumScores(section.main);
  if (answered === 0) return { answered: false, raw, level: null, label: null };
  const idx = classifyIndex(section.key, raw);
  return { answered: true, raw, level: idx + 1, label: LABELS_5[idx] };
}

function totalAnsweredCount() {
  return ITEMS.filter((it) => typeof state.answers[it.id] === "number").length;
}

function calcAge(birthStr, testStr) {
  if (!birthStr || !testStr) return null;
  const birth = new Date(birthStr + "T00:00:00");
  const test = new Date(testStr + "T00:00:00");
  if (isNaN(birth.getTime()) || isNaN(test.getTime())) return null;
  if (test < birth) return null;
  let y = test.getFullYear() - birth.getFullYear();
  let m = test.getMonth() - birth.getMonth();
  let d = test.getDate() - birth.getDate();
  if (d < 0) {
    m -= 1;
    const prevMonthLastDay = new Date(test.getFullYear(), test.getMonth(), 0).getDate();
    d += prevMonthLastDay;
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { years: y, months: m, days: d };
}

const LEVEL_COLORS = ["#c0392b", "#e08a3c", "#2e8b57", "#e08a3c", "#c0392b"];

/* -------------------------------------------------------------------- */
/* Render principal                                                     */
/* -------------------------------------------------------------------- */

const appMain = document.getElementById("app-main");
const stepperEl = document.getElementById("stepper");
const progressFill = document.getElementById("progress-fill");
const progressMeta = document.getElementById("progress-meta");
const navFooter = document.getElementById("nav-footer");

function render() {
  const def = STEP_DEFS[currentStepIndex];
  let html = "";
  switch (def.type) {
    case "welcome":
      html = renderWelcome();
      break;
    case "datos":
      html = renderDatos();
      break;
    case "section":
      html = renderSection(def.section);
      break;
    case "resultados":
      html = renderResultados();
      break;
    case "interpretacion":
      html = renderInterpretacion();
      break;
  }
  appMain.innerHTML = `<div class="screen">${html}</div>`;
  renderStepper();
  renderProgress();
  renderNavFooter(def);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (def.type === "resultados") {
    drawResultCharts();
  }
  attachScreenHandlers(def);
}

function renderStepper() {
  stepperEl.innerHTML = STEP_DEFS.map((d, i) => {
    const cls = i === currentStepIndex ? "active" : i < currentStepIndex ? "done" : "";
    return `<button class="step-chip ${cls}" data-step="${i}" type="button">
      <span class="dot"></span>${escapeHtml(d.label)}
    </button>`;
  }).join("");
  stepperEl.querySelectorAll(".step-chip").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.step, 10)));
  });
}

function renderProgress() {
  const answered = totalAnsweredCount();
  const pct = Math.round((answered / ITEMS.length) * 100);
  progressFill.style.width = pct + "%";
  progressMeta.innerHTML = `<span>${escapeHtml(STEP_DEFS[currentStepIndex].label)}</span><span>${answered} / ${ITEMS.length} ítems respondidos (${pct}%)</span>`;
}

function renderNavFooter(def) {
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === STEP_DEFS.length - 1;
  navFooter.innerHTML = `
    <div class="nav-footer-inner">
      <button class="btn btn-secondary" id="btn-prev" ${isFirst ? "disabled" : ""} type="button">← Anterior</button>
      <span class="save-indicator" id="save-indicator">✓ Guardado automáticamente</span>
      <button class="btn btn-primary" id="btn-next" type="button">${isLast ? "Finalizar" : "Siguiente →"}</button>
    </div>`;
  document.getElementById("btn-prev").addEventListener("click", () => goToStep(currentStepIndex - 1));
  document.getElementById("btn-next").addEventListener("click", () => {
    if (isLast) {
      showToast("¡Gracias! Puede revisar los resultados o imprimir el informe.");
      goToStep(STEP_DEFS.findIndex((d) => d.type === "resultados"));
    } else {
      goToStep(currentStepIndex + 1);
    }
  });
}

function goToStep(i) {
  if (i < 0 || i >= STEP_DEFS.length) return;
  currentStepIndex = i;
  saveState(false);
  render();
}

/* -------------------------------------------------------------------- */
/* Pantalla: Bienvenida                                                 */
/* -------------------------------------------------------------------- */

function renderWelcome() {
  return `
  <div class="card welcome-hero">
    <div class="emoji">🧸</div>
    <h1>Perfil Sensorial del Bebé/Niño Pequeño 2</h1>
    <p>Cuestionario interactivo para padres, madres o cuidadores(as) de niños(as) de <strong>7 a 35 meses</strong>.
    Responda cada enunciado a su propio ritmo — su progreso se guarda automáticamente en este dispositivo — y al final
    el/la profesional podrá revisar los puntajes y la clasificación ya calculados.</p>

    <div class="info-grid">
      <div class="info-item"><div class="n">54</div><div class="l">enunciados en total</div></div>
      <div class="info-item"><div class="n">7</div><div class="l">secciones sensoriales</div></div>
      <div class="info-item"><div class="n">4</div><div class="l">cuadrantes de Dunn</div></div>
      <div class="info-item"><div class="n">~10</div><div class="l">minutos aproximados</div></div>
    </div>

    <p style="text-align:left; font-weight:700; color:var(--navy); margin-bottom:6px;">Escala de respuesta</p>
    <p style="text-align:left; color:var(--text-soft); font-size:13.5px; margin-top:0;">Cuando se le presenta la oportunidad, mi niño(a)…</p>
    <div class="scale-legend">
      ${RESPONSE_OPTIONS.map(
        (o) => `<div class="item"><strong>${escapeHtml(o.label)}</strong><span>${escapeHtml(o.sub)}</span></div>`
      ).join("")}
    </div>
  </div>

  <div class="card">
    <h2 style="font-size:16px;">¿Ya tiene respuestas guardadas?</h2>
    <p class="lead">Puede continuar donde quedó, exportar sus respuestas como archivo, o empezar de nuevo. Use los íconos de la barra superior en cualquier momento.</p>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn btn-primary" id="btn-start">Comenzar →</button>
      <button class="btn btn-secondary" id="btn-continue">Continuar donde quedé</button>
    </div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: Datos del niño(a)                                          */
/* -------------------------------------------------------------------- */

const CHILD_FIELDS = [
  { key: "nombre", label: "Nombre(s) del niño(a)", type: "text" },
  { key: "apellido", label: "Apellido", type: "text" },
  { key: "nombrePreferido", label: "Nombre preferido (si es diferente)", type: "text" },
  { key: "id", label: "Número de ID", type: "text" },
  { key: "sexo", label: "Sexo", type: "pill", options: ["Masculino", "Femenino"] },
  { key: "fechaNacimiento", label: "Fecha de nacimiento", type: "date" },
  { key: "fechaPrueba", label: "Fecha de la prueba", type: "date" },
  { key: "examinador", label: "Nombre del examinador(a)/proveedor(a)", type: "text" },
  { key: "profesion", label: "Profesión del examinador(a)", type: "text" },
  { key: "persona", label: "Persona que llenó la forma", type: "text" },
  { key: "relacion", label: "Relación con el niño(a)", type: "text" },
  { key: "guarderia", label: "Nombre de la guardería", type: "text" },
  { key: "prematuro", label: "¿Nació el niño(a) prematuramente?", type: "pill", options: ["Sí", "No"] },
  { key: "semanasAntes", label: "Si sí, ¿cuántas semanas antes?", type: "text" },
  { key: "orden", label: "Orden de nacimiento entre hermanos(as)", type: "select",
    options: ["Hijo único", "Primero(a)", "Segundo(a)", "Tercero(a)", "Cuarto(a)", "Quinto(a)", "Otro"] },
  { key: "masTresNinos", label: "¿Más de 3 niños(as) de 0-18 años vivieron en el hogar en los últimos 12 meses?",
    type: "pill", options: ["Sí", "No"], span2: true },
];

function renderDatos() {
  const c = state.child;
  const age = calcAge(c.fechaNacimiento, c.fechaPrueba);
  const ageHtml = age
    ? `Edad calculada: <strong>${age.years} año(s), ${age.months} mes(es), ${age.days} día(s)</strong>`
    : "Complete ambas fechas para calcular la edad automáticamente.";

  const fieldsHtml = CHILD_FIELDS.map((f) => {
    const val = c[f.key] || "";
    const spanCls = f.span2 ? " span-2" : "";
    if (f.type === "pill") {
      return `
      <div class="field${spanCls}">
        <label>${escapeHtml(f.label)}</label>
        <div class="pill-group" data-field="${f.key}">
          ${f.options
            .map(
              (opt) =>
                `<button type="button" class="pill-option${val === opt ? " selected" : ""}" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
            )
            .join("")}
        </div>
      </div>`;
    }
    if (f.type === "select") {
      return `
      <div class="field${spanCls}">
        <label>${escapeHtml(f.label)}</label>
        <select data-field="${f.key}">
          <option value="">— Seleccione —</option>
          ${f.options.map((opt) => `<option value="${escapeHtml(opt)}" ${val === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("")}
        </select>
      </div>`;
    }
    return `
    <div class="field${spanCls}">
      <label>${escapeHtml(f.label)}</label>
      <input type="${f.type}" data-field="${f.key}" value="${escapeHtml(val)}" />
    </div>`;
  }).join("");

  return `
  <div class="card">
    <h2>Datos de identificación</h2>
    <p class="lead">Esta información ayuda al profesional a interpretar los resultados. Ningún campo es obligatorio para continuar.</p>
    <div class="form-grid">${fieldsHtml}</div>
    <div class="age-result">📅 ${ageHtml}</div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: Sección del cuestionario                                   */
/* -------------------------------------------------------------------- */

function renderItemCard(id, isExtra) {
  const item = ITEMS_BY_ID[id];
  const current = state.answers[id];
  const answered = typeof current === "number";
  const color = QUAD_COLORS[item.quad] || QUAD_COLORS["-"];
  const quadLabel = item.quad === "-" ? "" : item.quad;

  const scaleHtml = RESPONSE_OPTIONS.map((o) => {
    const sel = current === o.score ? " selected" : "";
    return `<button type="button" class="scale-btn${sel}" data-item="${id}" data-score="${o.score}">
      ${escapeHtml(o.label)}<span class="n">${o.sub}</span>
    </button>`;
  }).join("");

  return `
  <div class="item-card ${answered ? "answered" : ""} ${isExtra ? "extra" : ""}" id="item-${id}">
    <div class="item-top">
      <div class="item-num">${id}</div>
      <div class="item-text">
        <span class="prefix">Mi niño(a)…</span> ${escapeHtml(item.text)}
        ${isExtra ? '<span class="item-extra-tag">Este ítem no suma a la puntuación de la sección; solo cuenta para su cuadrante.</span>' : ""}
      </div>
      ${quadLabel ? `<span class="quad-tag" style="background:${color}">${quadLabel}</span>` : ""}
    </div>
    <div class="scale-row">${scaleHtml}</div>
  </div>`;
}

function renderSection(section) {
  const allIds = [...section.main, ...section.extra];
  const answeredCount = countAnswered(allIds);
  const comment = state.comments[section.key] || "";

  const mainCards = section.main.map((id) => renderItemCard(id, false)).join("");
  const extraCards = section.extra.length
    ? `<p class="small-note" style="margin:18px 0 10px;">Los siguientes enunciados no se suman a la puntuación de esta sección; solo se usan para el total de su cuadrante (marcados con *).</p>${section.extra.map((id) => renderItemCard(id, true)).join("")}`
    : "";

  return `
  <div class="card">
    <div class="section-head">
      <div>
        <h2>${escapeHtml(section.title)}</h2>
        <p class="lead" style="margin-bottom:0;">${escapeHtml(section.help)}</p>
      </div>
      <span class="badge">${answeredCount} / ${allIds.length} respondidos</span>
    </div>
  </div>
  <div class="card">
    ${mainCards}
    ${extraCards}
    <div class="comment-field field">
      <label>Comentarios sobre esta sección (opcional)</label>
      <textarea data-comment="${section.key}" placeholder="Observaciones adicionales del cuidador(a)...">${escapeHtml(comment)}</textarea>
    </div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: Resultados                                                 */
/* -------------------------------------------------------------------- */

function levelBarHtml(result, maxLabel) {
  if (!result.answered) {
    return `<span class="pending-pill">⏳ Pendiente — sin respuestas aún</span>`;
  }
  const pct = ((result.level - 0.5) / 5) * 100;
  const color = LEVEL_COLORS[result.level - 1];
  return `
  <div class="level-bar-track">
    <div class="level-bar-fill" style="width:${pct}%; background:${color}22;"></div>
    <div class="level-bar-marker" style="left:${pct}%; background:${color};"></div>
  </div>
  <div class="level-scale-labels"><span>Mucho menos</span><span>Menos</span><span>Igual</span><span>Más</span><span>Mucho más</span></div>
  <span class="classification-pill" style="background:${color}">${escapeHtml(result.label)}</span>`;
}

function renderResultados() {
  const c = state.child;
  const childName = [c.nombre, c.apellido].filter(Boolean).join(" ") || "—";
  const age = calcAge(c.fechaNacimiento, c.fechaPrueba);
  const ageStr = age ? `${age.years} a. ${age.months} m. ${age.days} d.` : "—";

  const quadCards = QUADRANTS.map((q) => {
    const r = getQuadrantResult(q);
    return `
    <div class="result-card">
      <div class="rc-top">
        <h3>${escapeHtml(q.title)} <span style="color:var(--text-soft); font-weight:500;">/ ${q.subtitle}</span></h3>
        <span class="score">${r.raw} / ${q.max}</span>
      </div>
      ${levelBarHtml(r)}
    </div>`;
  }).join("");

  const sectionCards = SECTIONS.map((s) => {
    const r = getSectionResult(s);
    return `
    <div class="result-card">
      <div class="rc-top">
        <h3>${escapeHtml(shortLabel(s.title))}</h3>
        <span class="score">${r.raw} / ${s.max}</span>
      </div>
      ${levelBarHtml(r)}
    </div>`;
  }).join("");

  return `
  <div class="card no-print-margin">
    <div class="flex-between" style="flex-wrap:wrap; gap:10px;">
      <div>
        <h2>Resultados</h2>
        <p class="lead" style="margin-bottom:0;">Niño(a): <strong>${escapeHtml(childName)}</strong> · Edad: <strong>${ageStr}</strong></p>
      </div>
      <button class="btn btn-secondary btn-sm no-print" id="btn-print">🖨️ Imprimir informe</button>
    </div>
  </div>

  <div class="card">
    <h2 style="font-size:17px;">Cuadrantes sensoriales</h2>
    <div class="result-grid">${quadCards}</div>
  </div>

  <div class="card">
    <h2 style="font-size:17px;">Secciones sensoriales y de comportamiento</h2>
    <div class="result-grid">${sectionCards}</div>
  </div>

  <div class="chart-wrap">
    <h3>Cuadrantes</h3>
    <div id="chart-quad"></div>
  </div>
  <div class="chart-wrap">
    <h3>Secciones sensoriales y conductuales</h3>
    <div id="chart-sec"></div>
  </div>

  <div class="card">
    <p class="small-note">La clasificación se basa en las tablas normativas del protocolo original (Sensory Profile 2 User's Manual).
    Los resultados de esta herramienta son un apoyo al razonamiento clínico; la interpretación final corresponde al profesional tratante.
    Consulte la pestaña <strong>Guía profesional</strong> para más contexto.</p>
  </div>`;
}

function drawResultCharts() {
  const quadCats = QUADRANTS.map((q) => `${q.title}`);
  const quadVals = QUADRANTS.map((q) => {
    const r = getQuadrantResult(q);
    return r.answered ? r.level : null;
  });
  renderLineChart("chart-quad", quadCats, quadVals, "#3F9088");

  const secCats = SECTIONS.map((s) => shortLabel(s.title));
  const secVals = SECTIONS.map((s) => {
    const r = getSectionResult(s);
    return r.answered ? r.level : null;
  });
  renderLineChart("chart-sec", secCats, secVals, "#8C68A3");
}

function renderLineChart(containerId, categories, values, color) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const W = Math.max(480, categories.length * 120);
  const H = 260;
  const padL = 42,
    padR = 20,
    padT = 16,
    padB = 70;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const yMin = 0.5,
    yMax = 5.5;
  const yPix = (v) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const xPix = (i) => padL + (categories.length === 1 ? plotW / 2 : (i * plotW) / (categories.length - 1));

  let gridLines = "";
  for (let lvl = 1; lvl <= 5; lvl++) {
    const y = yPix(lvl);
    gridLines += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#EAE2E8" stroke-width="1"/>`;
    gridLines += `<text x="${padL - 8}" y="${y + 4}" font-size="11" fill="#6B6672" text-anchor="end">${lvl}</text>`;
  }

  const segments = [];
  let current = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push([xPix(i), yPix(v)]);
  });
  if (current.length) segments.push(current);

  const pathEls = segments
    .map(
      (seg) =>
        `<polyline points="${seg.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("");

  const circles = values
    .map((v, i) => (v == null ? "" : `<circle cx="${xPix(i)}" cy="${yPix(v)}" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>`))
    .join("");

  const catLabels = categories
    .map((catText, i) => {
      const x = xPix(i),
        y = H - padB + 16;
      return `<text x="${x}" y="${y}" font-size="10.5" fill="#2A2730" text-anchor="end" transform="rotate(-30 ${x} ${y})">${escapeHtml(catText)}</text>`;
    })
    .join("");

  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#D8CDD4" stroke-width="1.5"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#D8CDD4" stroke-width="1.5"/>
    ${pathEls}
    ${circles}
    ${catLabels}
  </svg>`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: Interpretación (guía profesional)                          */
/* -------------------------------------------------------------------- */

function renderInterpretacion() {
  const defs = QUADRANTS.map(
    (q) => `
    <div class="def-item" style="border-left-color:${QUAD_COLORS[q.key]}">
      <h4>${escapeHtml(q.title)} / ${escapeHtml(q.subtitle)}</h4>
      <p>${escapeHtml(q.def)}</p>
    </div>`
  ).join("");

  const secDefs = SECTIONS.map(
    (s) => `
    <div class="def-item">
      <h4>${escapeHtml(shortLabel(s.title))}</h4>
      <p>${escapeHtml(s.help)}</p>
    </div>`
  ).join("");

  const recs = RECOMMENDATIONS.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  return `
  <div class="card">
    <h2>Guía de interpretación para el profesional</h2>
    <p class="lead">Las puntuaciones se ubican en una curva normal. Los puntajes que se alejan una desviación estándar
    o más de la media se expresan como “Más que Otros” o “Menos que Otros”; los que se alejan dos desviaciones estándar
    o más se expresan como “Mucho Más que Otros” o “Mucho Menos que Otros”. Un puntaje “Igual que la Mayoría de Otros”
    indica un patrón típico para la edad.</p>
  </div>

  <div class="card">
    <h2 style="font-size:16px;">Definición de los cuatro cuadrantes (modelo de Dunn)</h2>
    <div class="def-list">${defs}</div>
  </div>

  <div class="card">
    <h2 style="font-size:16px;">Secciones sensoriales y de comportamiento</h2>
    <div class="def-list">${secDefs}</div>
  </div>

  <div class="card">
    <h2 style="font-size:16px;">Recomendaciones para el análisis clínico</h2>
    <ol class="rec-list">${recs}</ol>
  </div>

  <div class="card">
    <h2 style="font-size:16px;">Notas clínicas adicionales</h2>
    <div class="field">
      <textarea id="clinical-notes" rows="5" placeholder="Espacio de uso libre del profesional...">${escapeHtml(state.clinicalNotes || "")}</textarea>
    </div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Manejadores de eventos por pantalla                                  */
/* -------------------------------------------------------------------- */

function attachScreenHandlers(def) {
  if (def.type === "welcome") {
    document.getElementById("btn-start").addEventListener("click", () => goToStep(1));
    document.getElementById("btn-continue").addEventListener("click", () => {
      const answered = totalAnsweredCount();
      let target = 1;
      if (answered > 0) {
        for (let i = 2; i < STEP_DEFS.length - 2; i++) {
          const sec = STEP_DEFS[i].section;
          if (countAnswered([...sec.main, ...sec.extra]) < sec.main.length + sec.extra.length) {
            target = i;
            break;
          }
          target = i + 1;
        }
      }
      goToStep(target);
    });
  }

  if (def.type === "datos") {
    appMain.querySelectorAll("input[data-field], select[data-field]").forEach((el) => {
      el.addEventListener("input", () => {
        state.child[el.dataset.field] = el.value;
        saveState(true);
        if (el.dataset.field === "fechaNacimiento" || el.dataset.field === "fechaPrueba") {
          const age = calcAge(state.child.fechaNacimiento, state.child.fechaPrueba);
          const box = appMain.querySelector(".age-result");
          box.innerHTML =
            "📅 " +
            (age
              ? `Edad calculada: <strong>${age.years} año(s), ${age.months} mes(es), ${age.days} día(s)</strong>`
              : "Complete ambas fechas para calcular la edad automáticamente.");
        }
      });
    });
    appMain.querySelectorAll(".pill-group").forEach((group) => {
      group.querySelectorAll(".pill-option").forEach((btn) => {
        btn.addEventListener("click", () => {
          const field = group.dataset.field;
          state.child[field] = btn.dataset.value;
          saveState(true);
          group.querySelectorAll(".pill-option").forEach((b) => b.classList.toggle("selected", b === btn));
        });
      });
    });
  }

  if (def.type === "section") {
    appMain.querySelectorAll(".scale-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = parseInt(btn.dataset.item, 10);
        const score = parseInt(btn.dataset.score, 10);
        state.answers[itemId] = score;
        saveState(true);
        const card = document.getElementById(`item-${itemId}`);
        card.classList.add("answered");
        card.querySelectorAll(".scale-btn").forEach((b) => b.classList.toggle("selected", b === btn));
        renderProgress();
        const badge = appMain.querySelector(".badge");
        if (badge) {
          const allIds = [...def.section.main, ...def.section.extra];
          badge.textContent = `${countAnswered(allIds)} / ${allIds.length} respondidos`;
        }
      });
    });
    const textarea = appMain.querySelector("[data-comment]");
    if (textarea) {
      textarea.addEventListener("input", () => {
        state.comments[textarea.dataset.comment] = textarea.value;
        saveState(true);
      });
    }
  }

  if (def.type === "resultados") {
    const printBtn = document.getElementById("btn-print");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
  }

  if (def.type === "interpretacion") {
    const notes = document.getElementById("clinical-notes");
    if (notes) {
      notes.addEventListener("input", () => {
        state.clinicalNotes = notes.value;
        saveState(true);
      });
    }
  }
}

/* -------------------------------------------------------------------- */
/* Barra superior: exportar / importar / reiniciar                      */
/* -------------------------------------------------------------------- */

function showSaveIndicator() {
  const el = document.getElementById("save-indicator");
  if (!el) return;
  el.style.opacity = "1";
  clearTimeout(el._fadeTimer);
  el._fadeTimer = setTimeout(() => {
    el.style.opacity = "0.55";
  }, 1200);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = [state.child.nombre, state.child.apellido].filter(Boolean).join("_") || "respuestas";
  a.href = url;
  a.download = `perfil_sensorial_${name}.json`.replace(/\s+/g, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Archivo descargado");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = Object.assign(defaultState(), parsed);
      currentStepIndex = 0;
      saveState(false);
      render();
      showToast("Respuestas importadas correctamente");
    } catch (e) {
      showToast("El archivo no es válido");
    }
  };
  reader.readAsText(file);
}

function confirmReset() {
  document.getElementById("modal-overlay").style.display = "flex";
}

function doReset() {
  state = defaultState();
  currentStepIndex = 0;
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById("modal-overlay").style.display = "none";
  render();
  showToast("Se reinició el cuestionario");
}

document.getElementById("btn-export").addEventListener("click", exportData);
document.getElementById("btn-import").addEventListener("click", () => document.getElementById("import-file").click());
document.getElementById("import-file").addEventListener("change", (e) => {
  if (e.target.files[0]) importData(e.target.files[0]);
  e.target.value = "";
});
document.getElementById("btn-reset").addEventListener("click", confirmReset);
document.getElementById("modal-cancel").addEventListener("click", () => {
  document.getElementById("modal-overlay").style.display = "none";
});
document.getElementById("modal-confirm").addEventListener("click", doReset);

render();
