/* ==========================================================================
   Perfil Sensorial del Bebé/Niño Pequeño 2 (Toddler Sensory Profile 2)
   Datos del instrumento: ítems, secciones, cuadrantes, rangos normativos.
   Basado en: Dunn, W. (2014). Toddler Sensory Profile 2. Pearson/PsychCorp.
   ========================================================================== */

// Escala de respuesta (igual que el formulario original)
const RESPONSE_OPTIONS = [
  { label: "Casi siempre", score: 5, sub: "90% o más del tiempo" },
  { label: "Frecuentemente", score: 4, sub: "75% del tiempo" },
  { label: "La mitad del tiempo", score: 3, sub: "50% del tiempo" },
  { label: "Ocasionalmente", score: 2, sub: "25% del tiempo" },
  { label: "Casi nunca", score: 1, sub: "10% o menos del tiempo" },
  { label: "No aplicable", score: 0, sub: "No observado o no aplica" },
];

// (id, cuadrante, texto)
const ITEMS = [
  [1, "SN", "necesita una rutina para quedarse contento(a) o calmado(a)."],
  [2, "SN", "actúa en una forma que interfiere con los programas y planes de la familia."],
  [3, "AV", "se resiste a jugar con otros niños(as)."],
  [4, "-", "toma más tiempo que otros niños(as) de su misma edad para responder a preguntas o acciones."],
  [5, "-", "se retira de situaciones."],
  [6, "-", "tiene un patrón de sueño impredecible."],
  [7, "-", "tiene un patrón impredecible para comer."],
  [8, "-", "se despierta fácilmente."],
  [9, "RG", "tiene muy poco contacto visual conmigo durante nuestras interacciones diarias."],
  [10, "AV", "se pone ansioso(a) ante situaciones nuevas."],

  [11, "RG", "solo me pone atención cuando le hablo en voz alta."],
  [12, "RG", "solo me pone atención cuando lo(a) toco (a pesar de que puede oír bien)."],
  [13, "SN", "se sobresalta con el ruido más fácilmente que otros niños(as) de su edad (por ejemplo, perros ladrando, niños(as) gritando)."],
  [14, "RG", "se distrae en ambientes ruidosos."],
  [15, "RG", "ignora los sonidos, incluyendo mi voz."],
  [16, "SN", "se disgusta o trata de escapar de los ambientes ruidosos."],
  [17, "-", "toma mucho tiempo para responder cuando le llaman por su nombre."],

  [18, "SK", "disfruta viendo objetos que se mueven o giran (por ejemplo, abanicos de techo, juguetes con ruedas)."],
  [19, "SK", "disfruta viendo objetos brillantes."],
  [20, "SK", "tiene atracción por las pantallas de televisión o computadora con gráficas brillantes de colores y con movimientos rápidos."],
  [21, "-", "se sobresalta con la luz brillante o impredecible (por ejemplo, al salir del interior al exterior)."],
  [22, "-", "le molestan las luces brillantes (por ejemplo, se esconde de la luz del sol que entra por la ventana del automóvil)."],
  [23, "RG", "le molestan las luces brillantes más que a otros niños(as) de su misma edad."],
  [24, "RG", "empuja los juguetes de colores brillantes alejándolos de él(ella)."],
  [25, "RG", "falla en responder a sí mismo(a) en el espejo."],

  [26, "SN", "se disgusta cuando le cortan las uñas."],
  [27, "AV", "se resiste a que lo(a) abracen."],
  [28, "AV", "se disgusta cuando se mueve entre lugares con temperaturas muy diferentes (por ejemplo, más frío, más caliente)."],
  [29, "AV", "se aleja de superficies ásperas, frías o pegajosas para no hacer contacto con ellas (por ejemplo, alfombra, mesa)."],
  [30, "RG", "choca con las cosas, sin darse cuenta de los objetos o personas que están en su camino."],
  [31, "SN", "se jalonea la ropa o se resiste a que lo(a) vistan."],
  [32, "SK", "disfruta de salpicar agua durante el baño o cuando nada."],
  [33, "AV", "se disgusta si su ropa, manos o cara están sucias."],
  [34, "SN", "se pone ansioso(a) cuando camina o gatea en ciertas superficies (por ejemplo, pasto/zacate, arena, alfombra, mosaico)."],
  [35, "AV", "se aparta si lo(a) tocan inesperadamente."],

  [36, "SK", "disfruta de las actividades físicas (por ejemplo, saltar, que lo(a) levanten en el aire)."],
  [37, "SK", "disfruta de las actividades rítmicas (por ejemplo, columpiarse, mecerse, paseos en automóvil)."],
  [38, "SK", "toma riesgos al trepar/escalar o hacer movimientos."],
  [39, "SN", "se disgusta cuando lo(a) ponen de espalda (por ejemplo, para cambiarle los pañales)."],
  [40, "RG", "parece torpe o propenso(a) a los accidentes."],
  [41, "SN", "se queja cuando lo(a) mueven (por ejemplo, hacerlo(a) caminar, cuando lo(a) pasan de una persona a otra)."],

  [42, "AV", "muestra un claro disgusto a toda clase de comida con la excepción de unos cuantos alimentos."],
  [43, "-", "babea."],
  [44, "SN", "prefiere una textura particular de comida (por ejemplo, suave, crujiente)."],
  [45, "RG", "toma líquidos para calmarse a sí mismo(a)."],
  [46, "SN", "tiene el reflejo de vómito con la comida o bebida."],
  [47, "-", "detiene la comida en los cachetes antes de tragar."],
  [48, "SN", "le cuesta trabajo acostumbrarse a la comida con pedazos sólidos."],

  [49, "AV", "hace berrinches."],
  [50, "-", "es muy apegado(a) a mí."],
  [51, "-", "permanece calmado(a) solo cuando lo(a) sostienen."],
  [52, "SN", "es quejumbroso(a) o irritable."],
  [53, "AV", "le molestan los ambientes nuevos."],
  [54, "AV", "se pone tan disgustado(a) en ambientes nuevos que le cuesta trabajo calmarse."],
].map(([id, quad, text]) => ({ id, quad, text }));

const ITEMS_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// Secciones: clave, título, ítems que cuentan para la puntuación cruda,
// ítems adicionales (solo cuentan para el cuadrante), puntaje máximo.
const SECTIONS = [
  { key: "GENERAL", title: "Procesamiento General", main: range(1, 10), extra: [], max: 50,
    help: "Comportamientos generales de autorregulación, sueño, alimentación y adaptación que no son específicos de una sola modalidad sensorial." },
  { key: "AUDITIVO", title: "Procesamiento Auditivo", main: range(11, 17), extra: [], max: 35,
    help: "Respuestas del niño(a) a la estimulación sonora del ambiente." },
  { key: "VISUAL", title: "Procesamiento Visual", main: range(18, 23), extra: [24, 25], max: 30,
    help: "Respuestas del niño(a) a la estimulación visual (luces, movimiento, brillo)." },
  { key: "TACTIL", title: "Procesamiento Táctil", main: range(26, 31), extra: [32, 33, 34, 35], max: 30,
    help: "Respuestas del niño(a) al tacto, texturas, temperatura y contacto físico." },
  { key: "MOVIMIENTO", title: "Procesamiento de Movimiento", main: range(36, 40), extra: [41], max: 25,
    help: "Respuestas del niño(a) al movimiento propio y a la estimulación vestibular." },
  { key: "ORAL", title: "Procesamiento Sensorial Oral", main: range(42, 48), extra: [], max: 35,
    help: "Respuestas del niño(a) a texturas, sabores y estimulación oral relacionada con la alimentación." },
  { key: "COMPORTAMIENTO", title: "Respuestas de Comportamiento", main: range(49, 54), extra: [], max: 30,
    help: "Respuestas de comportamiento (autorregulación emocional) asociadas al procesamiento sensorial general." },
];

// Cuadrantes: clave, título, ítems, puntaje máximo, definición clínica.
const QUADRANTS = [
  { key: "SK", title: "Búsqueda", subtitle: "Seeking", items: [18, 19, 20, 32, 36, 37, 38], max: 35,
    def: "El grado en el que un(a) niño(a) OBTIENE estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) busca estimulación sensorial con mayor frecuencia que sus pares." },
  { key: "AV", title: "Evitación", subtitle: "Avoiding", items: [3, 10, 27, 28, 29, 33, 35, 42, 49, 53, 54], max: 55,
    def: "El grado en el que un(a) niño(a) se ve MOLESTO(A) por la estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) se aleja de la estimulación sensorial con mayor frecuencia que sus pares." },
  { key: "SN", title: "Sensibilidad", subtitle: "Sensitivity", items: [1, 2, 13, 16, 26, 31, 34, 39, 41, 44, 46, 48, 52], max: 65,
    def: "El grado en el que un(a) niño(a) DETECTA estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) nota la estimulación sensorial con mayor frecuencia que sus pares." },
  { key: "RG", title: "Registro", subtitle: "Registration", items: [9, 11, 12, 14, 15, 23, 24, 25, 30, 40, 45], max: 55,
    def: "El grado en el que a un(a) niño(a) SE LE PASA POR ALTO la estimulación sensorial. Una puntuación de “Mucho Más que Otros” indica que el niño(a) no registra la estimulación sensorial con mayor frecuencia que sus pares." },
];

const QUAD_BY_KEY = Object.fromEntries(QUADRANTS.map((q) => [q.key, q]));

// Rangos normativos (límite inferior de cada banda) según la tabla
// "Summary Scores" del Sensory Profile 2 User's Manual.
const RANGES = {
  SK: { max: 35, lows: [0, 18, 23, 34, 36], disp: ["0-17", "18-22", "23-33", "34-35", "N/D"] },
  AV: { max: 55, lows: [0, 6, 11, 22, 27], disp: ["0-5", "6-10", "11-21", "22-26", "27-55"] },
  SN: { max: 65, lows: [0, 7, 13, 28, 35], disp: ["0-6", "7-12", "13-27", "28-34", "35-65"] },
  RG: { max: 55, lows: [0, 4, 10, 22, 27], disp: ["0-3", "4-9", "10-21", "22-26", "27-55"] },
  GENERAL: { max: 50, lows: [0, 6, 11, 23, 28], disp: ["0-5", "6-10", "11-22", "23-27", "28-50"] },
  AUDITIVO: { max: 35, lows: [0, 3, 6, 15, 18], disp: ["0-2", "3-5", "6-14", "15-17", "18-35"] },
  VISUAL: { max: 30, lows: [0, 7, 11, 20, 25], disp: ["0-6", "7-10", "11-19", "20-24", "25-30"] },
  TACTIL: { max: 30, lows: [0, 2, 6, 14, 17], disp: ["0-1", "2-5", "6-13", "14-16", "17-30"] },
  MOVIMIENTO: { max: 25, lows: [0, 10, 13, 21, 24], disp: ["0-9", "10-12", "13-20", "21-23", "24-25"] },
  ORAL: { max: 35, lows: [0, 2, 6, 16, 20], disp: ["0-1", "2-5", "6-15", "16-19", "20-35"] },
  COMPORTAMIENTO: { max: 30, lows: [0, 4, 7, 15, 18], disp: ["0-3", "4-6", "7-14", "15-17", "18-30"] },
};

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

const RECOMMENDATIONS = [
  "Revise primero los cuatro cuadrantes: indican el patrón general de autorregulación sensorial del niño(a) (búsqueda, evitación, sensibilidad, registro).",
  "Cruce los cuadrantes con las secciones sensoriales específicas (auditivo, visual, táctil, movimiento, oral) para identificar en qué modalidad(es) sensorial(es) se concentran las diferencias encontradas.",
  "Considere el contexto del desarrollo típico de 7 a 35 meses, la historia clínica, la prematurez y otros antecedentes registrados en los datos del niño(a).",
  "Use los comentarios cualitativos del cuidador(a) en cada sección como información complementaria a los puntajes.",
  "Los resultados de esta herramienta son un apoyo al razonamiento clínico; la interpretación final y las recomendaciones de intervención corresponden al criterio del profesional tratante.",
];

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
