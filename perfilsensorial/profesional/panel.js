/* ==========================================================================
   Panel profesional — inicio de sesión, creación de enlaces por sesión y
   lista de pacientes. Solo la profesional autenticada ve las sesiones
   (la regla de acceso está en la base de datos, no en este archivo).
   ========================================================================== */

const PERFILES = {
  bebe: { nombre: "Bebé / Niño pequeño", edad: "7 a 35 meses", minutos: 10 },
  escolar: { nombre: "Escolares", edad: "3 a 14 años", minutos: 15 },
};

const panel = document.getElementById("panel");
let sesiones = [];
let filtro = "todas";
let busqueda = "";
let ultimaCreada = null;
let toastTimer = null;

function esc(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function confirmar({ titulo, texto, boton, peligro, alConfirmar }) {
  const overlay = document.getElementById("modal-overlay");
  overlay.querySelector("h3").textContent = titulo;
  overlay.querySelector("p").textContent = texto;
  const ok = document.getElementById("modal-confirm");
  ok.textContent = boton;
  ok.className = "btn " + (peligro ? "btn-danger" : "btn-primary");
  const cerrar = () => (overlay.style.display = "none");
  ok.onclick = () => { cerrar(); alConfirmar(); };
  document.getElementById("modal-cancel").onclick = cerrar;
  overlay.style.display = "flex";
}

const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—");

function estadoDe(s) {
  if (s.estado === "enviada") return "enviada";
  return new Date(s.expira_en) < new Date() ? "vencida" : "pendiente";
}

function enlaceDe(s) {
  return new URL(`../${s.perfil}/?s=${s.token}`, location.href).href;
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("Enlace copiado");
}

function mensajeWhatsapp(s) {
  const p = PERFILES[s.perfil];
  const quien = s.referencia ? ` de ${s.referencia}` : "";
  return `Hola 👋 Le comparto el enlace para diligenciar el Perfil Sensorial${quien}. Toma unos ${p.minutos} minutos y puede hacerlo desde el celular:\n${enlaceDe(s)}`;
}

/* ---------------------------------------------------------------------- */
/* Pantallas                                                               */
/* ---------------------------------------------------------------------- */

function setSesionUI(user) {
  const acciones = document.getElementById("header-actions");
  acciones.hidden = !user;
  document.getElementById("user-email").textContent = user ? user.email : "";
}

function pantallaMensaje(icono, titulo, texto) {
  panel.innerHTML = `<div class="card welcome-hero gate"><div class="gate-icon">${icono}</div><h1 style="font-size:24px;">${titulo}</h1><p>${texto}</p></div>`;
}

function pantallaLogin(error) {
  setSesionUI(null);
  panel.innerHTML = `
  <div class="card login-card">
    <h2>Ingreso profesional</h2>
    <p class="lead">Acceda con su cuenta para crear enlaces de evaluación y consultar los resultados de sus pacientes.</p>
    <form id="form-login" autocomplete="on">
      <div class="field" style="margin-bottom:12px;"><label for="email">Correo</label><input type="text" inputmode="email" id="email" name="email" autocomplete="username" required /></div>
      <div class="field"><label for="password">Contraseña</label><input type="password" id="password" name="password" autocomplete="current-password" required /></div>
      <button class="btn btn-primary" type="submit" id="btn-login" style="margin-top:16px; width:100%; justify-content:center;">Ingresar</button>
      <div class="form-error" id="login-error">${error ? esc(error) : ""}</div>
    </form>
    <p class="small-note" style="margin-top:14px;">¿Es paciente o cuidador(a)? Use el enlace personal que le envió su profesional.</p>
  </div>`;
  document.getElementById("form-login").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = document.getElementById("btn-login");
    const err = document.getElementById("login-error");
    btn.disabled = true;
    btn.textContent = "Ingresando…";
    err.textContent = "";
    try {
      const user = await API.iniciarSesion(document.getElementById("email").value.trim(), document.getElementById("password").value);
      await pantallaPanel(user);
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Ingresar";
      err.textContent = /invalid|credentials/i.test(e.message) ? "Correo o contraseña incorrectos." : "No se pudo ingresar. Revise su conexión e intente de nuevo.";
    }
  });
}

async function pantallaPanel(user) {
  setSesionUI(user);
  panel.innerHTML = `
  <div class="card">
    <h2>Nueva sesión de evaluación</h2>
    <p class="lead">Cree un enlace único para cada paciente y envíeselo al cuidador(a). El cuidador responde sin crear cuenta y <strong>no ve los resultados</strong>: solo usted los consulta aquí.</p>
    <form id="form-nueva" class="form-row">
      <div class="field"><label for="perfil">Cuestionario</label>
        <select id="perfil">${Object.entries(PERFILES).map(([id, p]) => `<option value="${id}">${esc(p.nombre)} (${esc(p.edad)})</option>`).join("")}</select></div>
      <div class="field"><label for="referencia">Paciente (nombre o alias)</label><input type="text" id="referencia" maxlength="120" placeholder="Ej.: Sofía R." required /></div>
      <button class="btn btn-primary" type="submit" id="btn-crear">Crear enlace</button>
    </form>
    <div id="compartir"></div>
  </div>

  <div class="card">
    <div class="toolbar">
      <h2 style="margin:0;">Sesiones</h2>
      <div class="chips" id="chips"></div>
      <div class="field"><input type="text" id="buscar" placeholder="Buscar por paciente…" aria-label="Buscar por paciente" /></div>
      <button class="btn btn-secondary btn-sm" id="btn-actualizar" type="button">↻ Actualizar</button>
    </div>
    <div id="lista" class="session-list"></div>
  </div>`;

  document.getElementById("form-nueva").addEventListener("submit", crearSesion);
  document.getElementById("buscar").addEventListener("input", (e) => { busqueda = e.target.value.trim().toLowerCase(); pintarLista(); });
  document.getElementById("btn-actualizar").addEventListener("click", cargarSesiones);
  await cargarSesiones();
}

/* ---------------------------------------------------------------------- */
/* Sesiones                                                                */
/* ---------------------------------------------------------------------- */

async function cargarSesiones() {
  const lista = document.getElementById("lista");
  if (!lista) return;
  try {
    sesiones = await API.listarSesiones();
    pintarLista();
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<div class="empty-state">No se pudieron cargar las sesiones. Revise su conexión e intente de nuevo.</div>`;
  }
}

function pintarLista() {
  const chips = document.getElementById("chips");
  const lista = document.getElementById("lista");
  if (!lista) return;
  const conteo = { todas: sesiones.length, pendiente: 0, enviada: 0, vencida: 0 };
  sesiones.forEach((s) => conteo[estadoDe(s)]++);
  chips.innerHTML = [["todas", "Todas"], ["enviada", "Enviadas"], ["pendiente", "Pendientes"], ["vencida", "Vencidas"]]
    .map(([k, n]) => `<button class="chip-filter ${filtro === k ? "active" : ""}" data-filtro="${k}" type="button">${n} (${conteo[k]})</button>`)
    .join("");
  chips.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => { filtro = b.dataset.filtro; pintarLista(); }));

  const visibles = sesiones.filter((s) => (filtro === "todas" || estadoDe(s) === filtro) &&
    (!busqueda || (s.referencia || "").toLowerCase().includes(busqueda) || ((s.datos_nino && s.datos_nino.nombre) || "").toLowerCase().includes(busqueda)));

  if (!visibles.length) {
    lista.innerHTML = `<div class="empty-state">${sesiones.length ? "No hay sesiones con ese filtro." : "Aún no hay sesiones. Cree la primera arriba."}</div>`;
    return;
  }
  lista.innerHTML = visibles.map(tarjeta).join("");
  lista.querySelectorAll("[data-accion]").forEach((b) => b.addEventListener("click", () => accion(b.dataset.accion, b.dataset.id)));
}

function tarjeta(s) {
  const est = estadoDe(s);
  const p = PERFILES[s.perfil] || { nombre: s.perfil };
  const dn = s.datos_nino || {};
  const registrado = [dn.nombre, dn.apellido].filter(Boolean).join(" ");
  const etiquetaEstado = { enviada: "Enviada", pendiente: "Pendiente", vencida: "Vencida" }[est];
  const meta = [p.nombre, `Creada ${fecha(s.creada_en)}`,
    est === "enviada" ? `Enviada ${fechaHora(s.enviada_en)}` : `Vence ${fecha(s.expira_en)}`,
    registrado && registrado !== s.referencia ? `Registrado por el cuidador: ${registrado}` : ""].filter(Boolean).join(" · ");
  const botones = est === "enviada"
    ? `<a class="btn btn-primary btn-sm" href="sesion/?id=${esc(s.id)}">Ver resultados</a>`
    : est === "pendiente"
      ? `<button class="btn btn-secondary btn-sm" data-accion="copiar" data-id="${esc(s.id)}" type="button">Copiar enlace</button>
         <button class="btn btn-secondary btn-sm" data-accion="whatsapp" data-id="${esc(s.id)}" type="button">WhatsApp</button>
         <button class="btn btn-secondary btn-sm" data-accion="abrir" data-id="${esc(s.id)}" type="button">Abrir aquí</button>`
      : `<button class="btn btn-secondary btn-sm" data-accion="renovar" data-id="${esc(s.id)}" type="button">Renovar enlace</button>`;
  return `
  <div class="session-card">
    <div class="sc-main"><span class="sc-ref">${esc(s.referencia || "(sin referencia)")}</span><span class="estado ${est}">${etiquetaEstado}</span></div>
    <div class="sc-actions">${botones}<button class="btn btn-ghost btn-sm" data-accion="eliminar" data-id="${esc(s.id)}" type="button" title="Eliminar sesión">🗑️</button></div>
    <div class="sc-meta">${esc(meta)}</div>
  </div>`;
}

async function accion(que, id) {
  const s = sesiones.find((x) => x.id === id);
  if (!s) return;
  if (que === "copiar") return copiar(enlaceDe(s));
  if (que === "whatsapp") return window.open(`https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp(s))}`, "_blank", "noopener");
  if (que === "abrir") return window.open(enlaceDe(s), "_blank", "noopener");
  if (que === "renovar") {
    try { await API.renovarSesion(id, 30); toast("Enlace renovado por 30 días"); await cargarSesiones(); } catch (e) { toast("No se pudo renovar el enlace"); }
    return;
  }
  if (que === "eliminar") {
    confirmar({
      titulo: "¿Eliminar esta sesión?",
      texto: `Se borrarán de forma definitiva${s.estado === "enviada" ? " las respuestas, los resultados y las notas" : " el enlace"} de "${s.referencia || "esta sesión"}". Esta acción no se puede deshacer.`,
      boton: "Sí, eliminar",
      peligro: true,
      alConfirmar: async () => {
        try { await API.eliminarSesion(id); toast("Sesión eliminada"); await cargarSesiones(); } catch (e) { toast("No se pudo eliminar la sesión"); }
      },
    });
  }
}

async function crearSesion(ev) {
  ev.preventDefault();
  const btn = document.getElementById("btn-crear");
  const perfil = document.getElementById("perfil").value;
  const referencia = document.getElementById("referencia").value.trim();
  if (!referencia) return;
  btn.disabled = true;
  btn.textContent = "Creando…";
  try {
    ultimaCreada = await API.crearSesion(perfil, referencia);
    document.getElementById("referencia").value = "";
    mostrarEnlace(ultimaCreada);
    await cargarSesiones();
  } catch (e) {
    console.error(e);
    toast("No se pudo crear la sesión. Intente de nuevo.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Crear enlace";
  }
}

function mostrarEnlace(s) {
  const box = document.getElementById("compartir");
  box.innerHTML = `
  <div class="share-box">
    <strong>Enlace listo para ${esc(s.referencia)}</strong>
    <p class="small-note" style="margin:4px 0 10px;">Envíeselo al cuidador(a). Es personal: sirve una sola vez y vence en 30 días.</p>
    <input type="text" readonly value="${esc(enlaceDe(s))}" id="enlace-creado" onfocus="this.select()" />
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
      <button class="btn btn-primary btn-sm" id="c-copiar" type="button">Copiar enlace</button>
      <button class="btn btn-secondary btn-sm" id="c-wa" type="button">Enviar por WhatsApp</button>
      <button class="btn btn-secondary btn-sm" id="c-abrir" type="button">Abrir aquí (diligenciar en consulta)</button>
    </div>
  </div>`;
  document.getElementById("c-copiar").addEventListener("click", () => copiar(enlaceDe(s)));
  document.getElementById("c-wa").addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(mensajeWhatsapp(s))}`, "_blank", "noopener"));
  document.getElementById("c-abrir").addEventListener("click", () => window.open(enlaceDe(s), "_blank", "noopener"));
}

/* ---------------------------------------------------------------------- */
/* Arranque                                                                */
/* ---------------------------------------------------------------------- */

document.getElementById("btn-logout").addEventListener("click", async () => {
  try { await API.cerrarSesion(); } catch (e) { /* se limpia igual */ }
  sesiones = [];
  ultimaCreada = null;
  pantallaLogin();
});

window.addEventListener("focus", () => { if (document.getElementById("lista")) cargarSesiones(); });

(async function iniciar() {
  if (!API.configured()) {
    return pantallaMensaje("🛠️", "Servicio no configurado", "Falta conectar el panel con la base de datos (archivo <code>shared/config.js</code>).");
  }
  try {
    const user = await API.usuario();
    if (user) await pantallaPanel(user);
    else pantallaLogin();
  } catch (e) {
    console.error(e);
    pantallaLogin();
  }
})();
