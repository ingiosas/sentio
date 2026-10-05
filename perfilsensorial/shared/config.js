/* ==========================================================================
   Configuración de los perfiles sensoriales con sesiones en Supabase.

   supabaseUrl y supabaseAnonKey son datos PÚBLICOS por diseño (van en el
   navegador): la seguridad la dan las reglas de acceso de la base de datos
   (supabase/schema.sql), no el secreto de estas claves. NUNCA pegue aquí la
   clave "service_role" ni la contraseña de la base de datos.
   ========================================================================== */

const SENTIO_CONFIG = {
  supabaseUrl: "https://qnpotvldkhlbycballbm.supabase.co",       // Project URL del proyecto "Sentio" en Supabase
  supabaseAnonKey: "sb_publishable_D7ems7cHnitovFDEbSdOcg_p4DfbM5d",   // Clave pública (publishable): segura para el navegador; la protección está en las reglas de la base de datos
};

/* --------------------------------------------------------------------------
   Autorización para el tratamiento de datos (Ley 1581 de 2012).
   Texto PROVISIONAL: debe revisarlo la profesional / un asesor legal antes de
   usarlo con pacientes reales. Si cambia el contenido, cambie `version`:
   cada envío guarda la versión del texto que el cuidador aceptó.
   -------------------------------------------------------------------------- */
const CONSENT = {
  version: "2026-10-v1",
  title: "Autorización para el tratamiento de datos personales",
  paragraphs: [
    "Los datos que usted registre aquí (identificación del niño(a), respuestas del cuestionario y comentarios) son <strong>datos personales y datos sensibles de salud de un menor de edad</strong>. Serán tratados por <strong>Sentio — Terapia Ocupacional (Vanessa García)</strong> únicamente para evaluar el procesamiento sensorial del niño(a), elaborar el informe de resultados y acompañar el proceso terapéutico.",
    "Las respuestas se envían de forma cifrada a una base de datos protegida y <strong>solo la profesional que realiza la evaluación puede consultarlas</strong>. No se venden ni se comparten con terceros. Usted <strong>no está obligado(a)</strong> a responder preguntas sobre datos sensibles; sin embargo, sin ellas la evaluación puede quedar incompleta.",
    "Como titular o representante legal, usted puede conocer, actualizar, rectificar y solicitar la supresión de estos datos, o revocar esta autorización, escribiendo a <a href=\"mailto:sentio.to@gmail.com\">sentio.to@gmail.com</a> o por WhatsApp al +57 315 940 8955.",
  ],
  checkbox: "Soy el padre, madre, representante legal o cuidador(a) autorizado(a) del niño(a) y autorizo el tratamiento de sus datos personales y de salud en los términos descritos.",
};
