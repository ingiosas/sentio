/* ==========================================================================
   Perfil Sensorial 2 — lógica de la aplicación (motor compartido por todos
   los perfiles). Cada perfil define PROFILE, ITEMS, SECTIONS, QUADRANTS,
   RANGES, RECOMMENDATIONS y CHILD_FIELDS en su propio data.js.
   ========================================================================== */

/* Modos de uso:
   - "cuidador":    abre el enlace de una sesión (?s=TOKEN), responde y ENVÍA. Nunca ve resultados.
   - "profesional": la profesional abre una sesión ya enviada y ve los resultados (window.PROFESSIONAL_VIEW). */
const APP_MODE = window.PROFESSIONAL_VIEW ? "profesional" : "cuidador";
const SESSION_TOKEN = APP_MODE === "cuidador" ? new URLSearchParams(location.search).get("s") : null;
let SESSION_INFO = null; // lo mínimo que devuelve el servidor sobre la sesión (perfil, referencia)

// El progreso local del cuidador se guarda por enlace, para no mezclar pacientes en un mismo dispositivo.
const STORAGE_KEY = `${PROFILE.storageKey}_s_${(SESSION_TOKEN || "sin-enlace").slice(0, 16)}`;

const SECTION_STEPS = SECTIONS.map((s) => ({
  key: s.key,
  type: "section",
  label: shortLabel(s.title),
  section: s,
}));

const STEP_DEFS =
  APP_MODE === "profesional"
    ? [
        { key: "resultados", type: "resultados", label: "Resultados" },
        { key: "interpretacion", type: "interpretacion", label: "Guía y notas" },
      ]
    : [
        { key: "inicio", type: "welcome", label: "Inicio" },
        { key: "datos", type: "datos", label: "Datos del niño(a)" },
        ...SECTION_STEPS,
        { key: "enviar", type: "enviar", label: "Enviar" },
      ];

function shortLabel(title) {
  const sec = SECTIONS.find((s) => s.title === title);
  if (sec && sec.short) return sec.short;
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
    consent: null,
    currentStepIndex: 0,
  };
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadState() {
  // La profesional ve lo que el servidor guardó; nada de eso se escribe en el navegador.
  if (APP_MODE === "profesional") {
    const ses = window.PROFESSIONAL_VIEW.sesion;
    return {
      child: ses.datos_nino || {},
      answers: ses.respuestas || {},
      comments: ses.comentarios || {},
      clinicalNotes: ses.notas_clinicas || "",
      currentStepIndex: 0,
    };
  }
  let st = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) st = Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.warn("No se pudo leer el almacenamiento local", e);
  }
  if (!st.child.fechaPrueba) st.child.fechaPrueba = todayISO(); // fecha de la prueba: hoy, editable
  return st;
}

function saveState(showToast) {
  if (APP_MODE === "profesional") return;
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
    case "enviar":
      html = renderEnviar();
      break;
    case "resultados":
      html = renderResultados();
      break;
    case "interpretacion":
      html = renderInterpretacion();
      break;
  }
  setChrome(true);
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
  // En "Enviar" el botón principal está dentro de la pantalla; en la vista de la profesional el último paso vuelve al panel.
  const nextHtml =
    def.type === "enviar"
      ? "<span></span>"
      : `<button class="btn btn-primary" id="btn-next" type="button" ${def.type === "welcome" && state.consent !== CONSENT.version ? "disabled" : ""}>${isLast ? "Volver al panel" : "Siguiente →"}</button>`;
  const indicator = APP_MODE === "profesional" ? "Vista de la profesional" : "✓ Guardado automáticamente";
  navFooter.innerHTML = `
    <div class="nav-footer-inner">
      <button class="btn btn-secondary" id="btn-prev" ${isFirst ? "disabled" : ""} type="button">← Anterior</button>
      <span class="save-indicator" id="save-indicator">${indicator}</span>
      ${nextHtml}
    </div>`;
  document.getElementById("btn-prev").addEventListener("click", () => goToStep(currentStepIndex - 1));
  const next = document.getElementById("btn-next");
  if (next) {
    next.addEventListener("click", () => {
      if (isLast) location.href = "../";
      else goToStep(currentStepIndex + 1);
    });
  }
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
  const ref = SESSION_INFO && SESSION_INFO.referencia;
  const consentOk = state.consent === CONSENT.version;
  const answered = totalAnsweredCount();
  return `
  <div class="card welcome-hero">
    <img src="${PROFILE.assetsPath}/logo/sentio-icon.png" alt="Sentio" class="welcome-logo" />
    <h1>${escapeHtml(PROFILE.title)}</h1>
    ${ref ? `<p style="margin-bottom:6px;">Cuestionario para: <strong>${escapeHtml(ref)}</strong></p>` : ""}
    <p>Cuestionario para padres, madres o cuidadores(as) de niños(as) de <strong>${escapeHtml(PROFILE.ageText)}</strong>.
    Responda cada enunciado a su propio ritmo: su avance se guarda en este dispositivo. Al terminar, sus respuestas se envían
    de forma segura a su profesional de Terapia Ocupacional, quien las revisará.</p>

    <div class="info-grid">
      <div class="info-item"><div class="n">${ITEMS.length}</div><div class="l">enunciados en total</div></div>
      <div class="info-item"><div class="n">${SECTIONS.length}</div><div class="l">${escapeHtml(PROFILE.sectionsLabel)}</div></div>
      <div class="info-item"><div class="n">${escapeHtml(PROFILE.minutes)}</div><div class="l">minutos aproximados</div></div>
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
    <h2 style="font-size:17px;">${escapeHtml(CONSENT.title)}</h2>
    ${CONSENT.paragraphs.map((p) => `<p class="lead" style="margin-bottom:10px;">${p}</p>`).join("")}
    <label class="consent-check">
      <input type="checkbox" id="consent-check" ${consentOk ? "checked" : ""} />
      <span>${escapeHtml(CONSENT.checkbox)}</span>
    </label>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
      <button class="btn btn-primary" id="btn-start" ${consentOk ? "" : "disabled"}>${answered > 0 ? "Revisar desde el inicio" : "Comenzar →"}</button>
      ${answered > 0 ? `<button class="btn btn-secondary" id="btn-continue" ${consentOk ? "" : "disabled"}>Continuar donde quedé</button>` : ""}
    </div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: mensajes de acceso (enlace, envío) — el cuidador nunca ve resultados */
/* -------------------------------------------------------------------- */

function setChrome(visible) {
  const pw = document.querySelector(".progress-wrap");
  if (pw) pw.style.display = visible ? "" : "none";
  navFooter.style.display = visible ? "" : "none";
}

const CONTACTO_MEDIOS = `por WhatsApp al <a href="https://wa.me/573159408955" target="_blank" rel="noopener">+57 315 940 8955</a> o a <a href="mailto:sentio.to@gmail.com">sentio.to@gmail.com</a>`;

function renderGate(kind) {
  const base = {
    cargando: { icon: "⏳", title: "Cargando su cuestionario…", text: "Un momento, por favor." },
    "sin-enlace": { icon: "🔗", title: "Necesita su enlace personal", text: `Este cuestionario se responde con el enlace que le envió su profesional de Terapia Ocupacional (por WhatsApp o correo). Ábralo desde ese mensaje. Si no lo tiene, escríbanos ${CONTACTO_MEDIOS}.` },
    "enlace-invalido": { icon: "❓", title: "No reconocemos este enlace", text: `Revise que lo haya copiado completo o pida uno nuevo a su profesional o escríbanos ${CONTACTO_MEDIOS}.` },
    vencida: { icon: "⌛", title: "Este enlace ya venció", text: `Pida a su profesional que le genere uno nuevo o escríbanos ${CONTACTO_MEDIOS}.` },
    "ya-enviada": { icon: "✅", title: "Sus respuestas ya fueron enviadas", text: "Gracias. Su profesional ya las recibió y se comunicará con usted. No es necesario hacer nada más." },
    "enviada-ok": { icon: "💚", title: "¡Gracias! Sus respuestas fueron enviadas", text: "Su profesional de Terapia Ocupacional las recibió y las revisará. Puede cerrar esta ventana." },
    "sin-servicio": { icon: "🛠️", title: "El servicio no está disponible por ahora", text: `Estamos configurando el envío de respuestas. Intente de nuevo más tarde o escríbanos ${CONTACTO_MEDIOS}.` },
    "error-red": { icon: "📶", title: "No pudimos conectarnos", text: "Revise su conexión a internet e intente de nuevo.", retry: true },
  }[kind];
  setChrome(false);
  appMain.innerHTML = `
  <div class="screen"><div class="card welcome-hero gate">
    <img src="${PROFILE.assetsPath}/logo/sentio-icon.png" alt="Sentio" class="welcome-logo" />
    <div class="gate-icon">${base.icon}</div>
    <h1 style="font-size:24px;">${base.title}</h1>
    <p>${base.text}</p>
    ${base.retry ? '<button class="btn btn-primary" id="btn-retry">Reintentar</button>' : ""}
  </div></div>`;
  const retry = document.getElementById("btn-retry");
  if (retry) retry.addEventListener("click", bootstrap);
  window.scrollTo(0, 0);
}

/* -------------------------------------------------------------------- */
/* Pantalla: revisión final y envío (cuidador)                          */
/* -------------------------------------------------------------------- */

function pendientes() {
  const secciones = [];
  SECTIONS.forEach((sec) => {
    const ids = [...sec.main, ...sec.extra];
    const faltan = ids.length - countAnswered(ids);
    if (faltan > 0) secciones.push({ label: shortLabel(sec.title), faltan, step: STEP_DEFS.findIndex((d) => d.key === sec.key) });
  });
  const datos = [];
  if (!(state.child.nombre || "").trim()) datos.push("Nombre del niño(a)");
  if (!state.child.fechaNacimiento) datos.push("Fecha de nacimiento");
  const consentimiento = state.consent === CONSENT.version;
  return { secciones, datos, consentimiento, completo: !secciones.length && !datos.length && consentimiento };
}

function renderEnviar() {
  const p = pendientes();
  const answered = totalAnsweredCount();
  const age = calcAge(state.child.fechaNacimiento, state.child.fechaPrueba);
  const r = PROFILE.ageRange;
  const fueraDeRango = age && r && (age.years < r.minYears || age.years > r.maxYears);

  const lista = [];
  p.secciones.forEach((x) => lista.push(`<li><span><strong>${escapeHtml(x.label)}</strong>: faltan ${x.faltan} por responder</span> <button class="btn btn-secondary btn-sm" data-goto="${x.step}" type="button">Ir a la sección</button></li>`));
  if (p.datos.length) lista.push(`<li><span><strong>Datos del niño(a)</strong>: falta ${p.datos.map(escapeHtml).join(" y ")}</span> <button class="btn btn-secondary btn-sm" data-goto="1" type="button">Completar</button></li>`);
  if (!p.consentimiento) lista.push(`<li><span><strong>Autorización de datos</strong>: debe aceptarla al inicio</span> <button class="btn btn-secondary btn-sm" data-goto="0" type="button">Ir al inicio</button></li>`);

  return `
  <div class="card">
    <h2>Revisión final</h2>
    <p class="lead">Ha respondido <strong>${answered} de ${ITEMS.length}</strong> enunciados${state.child.nombre ? ` para <strong>${escapeHtml(state.child.nombre)}</strong>` : ""}.</p>
    ${fueraDeRango ? `<div class="age-result" style="margin-bottom:12px;"><span class="age-warn">⚠ Según las fechas, la edad del niño(a) está fuera del rango de este cuestionario (${escapeHtml(r.label)}). Verifique las fechas; si son correctas, igual puede enviarlas y su profesional lo revisará.</span></div>` : ""}
    ${p.completo
      ? `<div class="send-ready">✅ Todo está completo. Al enviar, sus respuestas llegan de inmediato a su profesional y <strong>ya no podrá modificarlas</strong>.</div>
         <button class="btn btn-primary" id="btn-send" type="button" style="margin-top:14px;">Enviar respuestas</button>`
      : `<p class="lead" style="margin-bottom:8px;">Para poder enviar, falta completar:</p>
         <ul class="pending-list">${lista.join("")}</ul>
         <button class="btn btn-primary" id="btn-send" type="button" disabled style="margin-top:14px;">Enviar respuestas</button>`}
    <p class="small-note" style="margin-top:12px;">Sus respuestas solo las puede consultar la profesional que realiza la evaluación.</p>
  </div>`;
}

function mostrarModal({ title, text, confirmLabel, onConfirm }) {
  const overlay = document.getElementById("modal-overlay");
  overlay.querySelector("h3").textContent = title;
  overlay.querySelector("p").textContent = text;
  const ok = document.getElementById("modal-confirm");
  const cancel = document.getElementById("modal-cancel");
  ok.textContent = confirmLabel;
  ok.className = "btn btn-primary";
  const cerrar = () => (overlay.style.display = "none");
  ok.onclick = () => { cerrar(); onConfirm(); };
  cancel.onclick = cerrar;
  overlay.style.display = "flex";
}

async function enviarAlServidor() {
  const btn = document.getElementById("btn-send");
  if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
  try {
    await API.enviarRespuestas(SESSION_TOKEN, state.child, state.answers, state.comments, CONSENT.version);
    localStorage.removeItem(STORAGE_KEY);
    renderGate("enviada-ok");
  } catch (e) {
    if (e.code === "sesion_ya_enviada") return renderGate("ya-enviada");
    if (e.code === "sesion_vencida") return renderGate("vencida");
    console.error("Error al enviar:", e);
    showToast("No se pudo enviar. Revise su conexión e intente de nuevo; sus respuestas siguen guardadas en este dispositivo.");
    if (btn) { btn.disabled = false; btn.textContent = "Enviar respuestas"; }
  }
}

/* -------------------------------------------------------------------- */
/* Vista de la profesional: datos de la evaluación y comentarios         */
/* -------------------------------------------------------------------- */

function fmtFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
}

function fmtFechaSimple(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ymd;
}

function renderDatosEvaluacion() {
  if (APP_MODE !== "profesional") return "";
  const ses = window.PROFESSIONAL_VIEW.sesion;
  const c = state.child;
  const kv = (k, v) => `<div class="kv"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`;
  const meta = [
    kv("Referencia de la sesión", ses.referencia || "—"),
    kv("Respuestas enviadas", fmtFecha(ses.enviada_en)),
    kv("Autorización de datos", ses.consentimiento_en ? `Aceptada el ${fmtFecha(ses.consentimiento_en)} (texto ${ses.consentimiento_version})` : "—"),
  ].join("");
  const datos = CHILD_FIELDS.filter((f) => !f.profesional && c[f.key])
    .map((f) => kv(f.label, f.type === "date" ? fmtFechaSimple(c[f.key]) : c[f.key]))
    .join("");
  const comentarios = SECTIONS.filter((x) => (state.comments[x.key] || "").trim())
    .map((x) => kv(shortLabel(x.title), state.comments[x.key]))
    .join("");
  return `
  <div class="card">
    <h2 style="font-size:17px;">Datos de la evaluación</h2>
    <div class="kv-grid">${meta}${datos}</div>
  </div>
  ${comentarios ? `<div class="card"><h2 style="font-size:17px;">Comentarios del cuidador(a)</h2><div class="kv-grid kv-one">${comentarios}</div></div>` : ""}`;
}

/* -------------------------------------------------------------------- */
/* Pantalla: Datos del niño(a)                                          */
/* -------------------------------------------------------------------- */

function ageMessageHtml() {
  const age = calcAge(state.child.fechaNacimiento, state.child.fechaPrueba);
  if (!age) return "Complete ambas fechas para calcular la edad automáticamente.";
  let html = `Edad calculada: <strong>${age.years} año(s), ${age.months} mes(es), ${age.days} día(s)</strong>`;
  const r = PROFILE.ageRange;
  if (r) {
    const inRange = age.years >= r.minYears && age.years <= r.maxYears;
    html += inRange
      ? `<br><span class="age-ok">✓ Dentro del rango del cuestionario (${escapeHtml(r.label)})</span>`
      : `<br><span class="age-warn">⚠ Fuera del rango del cuestionario (${escapeHtml(r.label)}). Verifique las fechas o elija otro perfil.</span>`;
  }
  return html;
}

function renderDatos() {
  const c = state.child;
  const ageHtml = ageMessageHtml();

  const fieldsHtml = CHILD_FIELDS.filter((f) => !f.profesional).map((f) => {
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
        <p class="lead" style="margin-bottom:0;">${escapeHtml(PROFILE.title)}<br>Niño(a): <strong>${escapeHtml(childName)}</strong> · Edad: <strong>${ageStr}</strong></p>
      </div>
      <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="btn-download-excel">📊 Descargar Excel diligenciado</button>
        <button class="btn btn-secondary btn-sm" id="btn-print">🖨️ Imprimir informe</button>
      </div>
    </div>
  </div>

  ${renderDatosEvaluacion()}

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
  const padL = 64,
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

  // La clase solo se usa en pantalla (adapta el ancho); el SVG exportado a Excel no depende de ella.
  container.innerHTML = `<svg class="line-chart${categories.length > 6 ? " wide" : ""}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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
    <div class="small-note" id="notes-status" style="margin-top:6px;">Las notas se guardan automáticamente en esta sesión.</div>
  </div>`;
}

/* -------------------------------------------------------------------- */
/* Manejadores de eventos por pantalla                                  */
/* -------------------------------------------------------------------- */

function attachScreenHandlers(def) {
  if (def.type === "welcome") {
    const check = document.getElementById("consent-check");
    const start = document.getElementById("btn-start");
    const cont = document.getElementById("btn-continue");
    check.addEventListener("change", () => {
      state.consent = check.checked ? CONSENT.version : null;
      saveState(false);
      [start, cont, document.getElementById("btn-next")].forEach((b) => b && (b.disabled = !check.checked));
    });
    start.addEventListener("click", () => goToStep(1));
    if (cont) {
      cont.addEventListener("click", () => {
        let target = 1;
        for (let i = 2; i < STEP_DEFS.length - 1; i++) {
          const sec = STEP_DEFS[i].section;
          if (countAnswered([...sec.main, ...sec.extra]) < sec.main.length + sec.extra.length) {
            target = i;
            break;
          }
          target = i + 1;
        }
        goToStep(target);
      });
    }
  }

  if (def.type === "enviar") {
    appMain.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => goToStep(parseInt(b.dataset.goto, 10))));
    const send = document.getElementById("btn-send");
    if (send && !send.disabled) {
      send.addEventListener("click", () =>
        mostrarModal({
          title: "¿Enviar sus respuestas?",
          text: "Una vez enviadas no podrá modificarlas. Su profesional las recibirá de inmediato.",
          confirmLabel: "Sí, enviar",
          onConfirm: enviarAlServidor,
        })
      );
    }
  }

  if (def.type === "datos") {
    appMain.querySelectorAll("input[data-field], select[data-field]").forEach((el) => {
      el.addEventListener("input", () => {
        state.child[el.dataset.field] = el.value;
        saveState(true);
        if (el.dataset.field === "fechaNacimiento" || el.dataset.field === "fechaPrueba") {
          const box = appMain.querySelector(".age-result");
          box.innerHTML = "📅 " + ageMessageHtml();
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
    const downloadBtn = document.getElementById("btn-download-excel");
    if (downloadBtn) downloadBtn.addEventListener("click", () => triggerExcelDownload(downloadBtn));
  }

  if (def.type === "interpretacion") {
    const notes = document.getElementById("clinical-notes");
    const status = document.getElementById("notes-status");
    if (notes) {
      let timer = null;
      notes.addEventListener("input", () => {
        state.clinicalNotes = notes.value;
        status.textContent = "Guardando…";
        clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            await API.guardarNotas(window.PROFESSIONAL_VIEW.sesion.id, state.clinicalNotes);
            status.textContent = "✓ Notas guardadas";
          } catch (e) {
            console.error(e);
            status.textContent = "⚠ No se pudieron guardar las notas. Revise su conexión y siga escribiendo para reintentar.";
          }
        }, 800);
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

async function triggerExcelDownload(btn) {
  const original = btn ? btn.innerHTML : null;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "⏳ Generando...";
  }
  try {
    await generateAndDownloadExcel();
    showToast("Archivo de Excel descargado");
  } catch (e) {
    console.error("Error generando el Excel:", e);
    showToast("No se pudo generar el Excel. Intente de nuevo.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* -------------------------------------------------------------------- */
/* Arranque                                                             */
/* -------------------------------------------------------------------- */

async function bootstrap() {
  if (APP_MODE === "profesional") return render();
  if (!SESSION_TOKEN) return renderGate("sin-enlace");
  if (!API.configured()) return renderGate("sin-servicio");
  renderGate("cargando");
  try {
    const ses = await API.obtenerSesion(SESSION_TOKEN);
    if (!ses) return renderGate("enlace-invalido");
    if (ses.perfil !== PROFILE.id) {
      // El enlace es de otro perfil: llevarlo al cuestionario correcto conservando el token.
      location.replace(`../${ses.perfil}/${location.search}`);
      return;
    }
    if (ses.estado === "enviada") return renderGate("ya-enviada");
    if (!ses.vigente) return renderGate("vencida");
    SESSION_INFO = ses;
    render();
  } catch (e) {
    console.error(e);
    renderGate("error-red");
  }
}

bootstrap();
