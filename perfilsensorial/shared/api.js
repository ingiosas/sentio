/* ==========================================================================
   Acceso a Supabase. Todo lo que habla con el servidor pasa por aquí.
   - Cuidador (sin cuenta): obtenerSesion / enviarRespuestas (funciones RPC).
   - Profesional (con cuenta): resto de métodos; las reglas de la base de datos
     (RLS) garantizan que solo vea sus propias sesiones.
   ========================================================================== */

const API = (() => {
  let client = null;

  function configured() {
    return !!(SENTIO_CONFIG.supabaseUrl && SENTIO_CONFIG.supabaseAnonKey && typeof supabase !== "undefined");
  }

  function sb() {
    if (!configured()) throw new Error("servicio_no_configurado");
    if (!client) {
      client = supabase.createClient(SENTIO_CONFIG.supabaseUrl, SENTIO_CONFIG.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
    }
    return client;
  }

  // Convierte el error de Supabase en un Error con un código estable (ej. "sesion_ya_enviada").
  function fail(error) {
    const msg = (error && error.message) || "error_desconocido";
    const known = ["sesion_no_encontrada", "sesion_ya_enviada", "sesion_vencida", "respuestas_invalidas",
      "datos_invalidos", "comentarios_invalidos", "consentimiento_requerido"].find((c) => msg.includes(c));
    const e = new Error(known || msg);
    e.code = known || "error";
    e.original = error;
    return e;
  }

  const SESION_LISTA = "id, token, perfil, referencia, estado, datos_nino, creada_en, expira_en, enviada_en";

  return {
    configured,

    /* ---- Cuidador ---- */
    async obtenerSesion(token) {
      const { data, error } = await sb().rpc("obtener_sesion", { p_token: token });
      if (error) throw fail(error);
      return data && data.length ? data[0] : null;
    },

    async enviarRespuestas(token, datos, respuestas, comentarios, versionConsentimiento) {
      const { error } = await sb().rpc("enviar_respuestas", {
        p_token: token,
        p_datos: datos,
        p_respuestas: respuestas,
        p_comentarios: comentarios,
        p_version_consentimiento: versionConsentimiento,
      });
      if (error) throw fail(error);
    },

    /* ---- Profesional ---- */
    async iniciarSesion(email, password) {
      const { data, error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw fail(error);
      return data.user;
    },

    async cerrarSesion() {
      await sb().auth.signOut();
    },

    async usuario() {
      const { data } = await sb().auth.getSession();
      return data && data.session ? data.session.user : null;
    },

    async listarSesiones() {
      const { data, error } = await sb().from("sesiones").select(SESION_LISTA).order("creada_en", { ascending: false });
      if (error) throw fail(error);
      return data;
    },

    async crearSesion(perfil, referencia) {
      const { data, error } = await sb().from("sesiones").insert({ perfil, referencia }).select(SESION_LISTA).single();
      if (error) throw fail(error);
      return data;
    },

    async obtenerSesionCompleta(id) {
      const { data, error } = await sb().from("sesiones").select("*").eq("id", id).maybeSingle();
      if (error) throw fail(error);
      return data;
    },

    async guardarNotas(id, notas) {
      const { error } = await sb().from("sesiones").update({ notas_clinicas: notas }).eq("id", id);
      if (error) throw fail(error);
    },

    async renovarSesion(id, dias) {
      const expira = new Date(Date.now() + dias * 86400000).toISOString();
      const { error } = await sb().from("sesiones").update({ expira_en: expira }).eq("id", id);
      if (error) throw fail(error);
    },

    async eliminarSesion(id) {
      const { error } = await sb().from("sesiones").delete().eq("id", id);
      if (error) throw fail(error);
    },
  };
})();
