/* ==========================================================================
   Perfil Sensorial 2 — datos comunes a todos los perfiles
   (escala de respuesta, niveles de clasificación, cuadrantes de Dunn).
   Basado en: Dunn, W. (2014). Sensory Profile 2. Pearson/PsychCorp.
   ========================================================================== */

// Escala de respuesta (igual en todos los cuestionarios del Perfil Sensorial 2)
const RESPONSE_OPTIONS = [
  { label: "Casi siempre", score: 5, sub: "90% o más del tiempo" },
  { label: "Frecuentemente", score: 4, sub: "75% del tiempo" },
  { label: "La mitad del tiempo", score: 3, sub: "50% del tiempo" },
  { label: "Ocasionalmente", score: 2, sub: "25% del tiempo" },
  { label: "Casi nunca", score: 1, sub: "10% o menos del tiempo" },
  { label: "No aplicable", score: 0, sub: "No observado o no aplica" },
];

const LABELS_5 = [
  "Mucho Menos que Otros",
  "Menos que Otros",
  "Igual que la Mayoría de Otros",
  "Más que Otros",
  "Mucho Más que Otros",
];

// Colores de marca Sentio: ámbar, morado, rosa y teal (los mismos 4 tonos
// que ciclan en las tarjetas de servicio del sitio principal).
const QUAD_COLORS = {
  SK: "#D1922E",
  AV: "#8C68A3",
  SN: "#C9548A",
  RG: "#3F9088",
  "-": "#9e9e9e",
};

// Nombre y definición clínica de cada cuadrante (modelo de Dunn)
const QUAD_META = {
  SK: { title: "Búsqueda", subtitle: "Seeking",
    def: "El grado en el que un(a) niño(a) OBTIENE estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) busca estimulación sensorial con mayor frecuencia que sus pares." },
  AV: { title: "Evitación", subtitle: "Avoiding",
    def: "El grado en el que un(a) niño(a) se ve MOLESTO(A) por la estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) se aleja de la estimulación sensorial con mayor frecuencia que sus pares." },
  SN: { title: "Sensibilidad", subtitle: "Sensitivity",
    def: "El grado en el que un(a) niño(a) DETECTA estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) nota la estimulación sensorial con mayor frecuencia que sus pares." },
  RG: { title: "Registro", subtitle: "Registration",
    def: "El grado en el que a un(a) niño(a) SE LE PASA POR ALTO la estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) no registra la estimulación sensorial con mayor frecuencia que sus pares." },
};

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

// Construye la lista de cuadrantes de un perfil a partir de sus ítems y máximos.
function buildQuadrants(def) {
  return ["SK", "AV", "SN", "RG"].map((key) => ({
    key,
    ...QUAD_META[key],
    items: def[key].items,
    max: def[key].max,
  }));
}
