/* ==========================================================================
   Perfil Sensorial 2 para escolares (Child Sensory Profile 2)
   Datos del perfil de 3:0 a 14:11 años: ítems, secciones, cuadrantes y rangos.
   Basado en: Dunn, W. (2014). Child Sensory Profile 2. Pearson/PsychCorp.
   (La escala de respuesta y las definiciones de cuadrantes están en
   ../shared/common-data.js)
   ========================================================================== */

const PROFILE = {
  id: "escolar",
  storageKey: "perfilSensorial2_escolar_v1",
  assetsPath: "../../assets",
  title: "Perfil Sensorial 2 para Escolares",
  ageText: "3 a 14 años",
  minutes: "~15",
  sectionsLabel: "secciones sensoriales y conductuales",
  jsonPrefix: "perfil_sensorial_escolar",
  filePrefix: "Perfil_Sensorial_Escolar",
  xlsx: {
    title: "PERFIL SENSORIAL 2 PARA ESCOLARES (3 A 14 AÑOS)",
    subtitle: "Child Sensory Profile 2 (Winnie Dunn, PhD - Pearson/PsychCorp) - Informe diligenciado a través de la aplicación web",
    ageLabel: "Cuestionario para padres o tutores - 3:0 a 14:11 años",
    interpSubtitle: "Uso clínico de los cuadrantes y secciones del Perfil Sensorial 2 para escolares (3 a 14 años).",
    theme: { dark: "FF1E4D2B", mid: "FF3A7D3C", light: "FFE2EFDA" },
    datosGroups: { personal: "Personal a cargo de la evaluación", contexto: "Datos escolares y antecedentes" },
  },
  // El cuestionario aplica a niños(as) de 3:0 a 14:11 años.
  ageRange: { minYears: 3, maxYears: 14, label: "3:0 a 14:11 años" },
};

// (id, cuadrante, texto)
const ITEMS = [
  // Procesamiento auditivo
  [1, "AV", "reacciona fuertemente a sonidos inesperados o altos (por ejemplo, sirenas, perros ladrando, secadora de pelo)."],
  [2, "AV", "se cubre los oídos con las manos para protegerlos de sonidos."],
  [3, "SN", "le cuesta trabajo completar las tareas cuando hay música o la televisión está prendida."],
  [4, "SN", "se distrae cuando hay mucho ruido a su alrededor."],
  [5, "AV", "se vuelve improductivo(a) con el ruido de fondo (por ejemplo, ventilador, refrigerador)."],
  [6, "SN", "parece ignorarme o no escuchar lo que estoy diciendo."],
  [7, "SN", "parece no oír cuando lo(a) llamo por su nombre (a pesar de que puede oír bien)."],
  [8, "RG", "disfruta de ruidos extraños o hace ruido(s) solo por diversión."],
  // Procesamiento visual
  [9, "SN", "prefiere jugar o trabajar con poca iluminación."],
  [10, "-", "prefiere estampados o colores brillantes para la ropa."],
  [11, "-", "disfruta viendo los detalles visuales en los objetos."],
  [12, "RG", "necesita ayuda para encontrar objetos que son evidentes para otras personas."],
  [13, "SN", "le molestan las luces brillantes más que a otros niños(as) de su misma edad."],
  [14, "SK", "observa a las personas mientras se mueven alrededor de la habitación."],
  [15, "AV", "le molestan las luces brillantes (por ejemplo, se esconde de la luz del sol que entra por la ventana del automóvil)."],
  // Procesamiento táctil
  [16, "SN", "muestra angustia cuando le arreglan (por ejemplo, pelea o llora cuando le cortan el pelo, le lavan la cara, le cortan las uñas)."],
  [17, "-", "le irrita usar zapatos o calcetines."],
  [18, "AV", "muestra una reacción emocional o agresiva cuando alguien lo(a) toca."],
  [19, "SN", "se pone ansioso(a) al estar de pie cerca de otros (por ejemplo, esperar en fila)."],
  [20, "SN", "se frota o rasca la parte del cuerpo donde le han tocado."],
  [21, "SK", "toca personas u objetos al grado de molestar a otras personas."],
  [22, "SK", "muestra necesidad de tocar juguetes, superficies o texturas (por ejemplo, quiere experimentar la sensación de todo)."],
  [23, "RG", "parece no darse cuenta del dolor."],
  [24, "RG", "parece no darse cuenta de los cambios de temperatura."],
  [25, "SK", "toca personas u objetos más que otros niños(as) de su misma edad."],
  [26, "RG", "parece no estar consciente de tener la cara o las manos sucias."],
  // Procesamiento de movimiento
  [27, "SK", "procura estar en movimiento hasta el grado que llega a interferir con sus actividades diarias (por ejemplo, no puede quedarse quieto(a), estar sentado(a) sin moverse)."],
  [28, "SK", "se mece sentado(a) en una silla, en el piso o estando de pie."],
  [29, "-", "titubea al subir o bajar de la acera/banqueta o de escalones (por ejemplo, es cauteloso(a), se detiene antes de moverse)."],
  [30, "SK", "se emociona cuando realiza tareas que implican movimiento."],
  [31, "SK", "toma riesgos al trepar/escalar o hacer movimientos que no son seguros."],
  [32, "SK", "busca oportunidades de caerse, sin considerar su propia seguridad (por ejemplo, se cae a propósito)."],
  [33, "RG", "cuando camina en terrenos desnivelados, pierde el equilibrio inesperadamente."],
  [34, "RG", "choca con las cosas, sin darse cuenta de los objetos o personas que están en su camino."],
  // Procesamiento de posición del cuerpo
  [35, "RG", "se mueve de manera rígida."],
  [36, "RG", "se cansa fácilmente, especialmente cuando está de pie o sosteniendo el cuerpo en una posición."],
  [37, "RG", "parece tener músculos débiles."],
  [38, "RG", "necesita apoyo para soportarse a sí mismo(a) (por ejemplo, sostiene la cabeza con sus manos, se recarga en la pared)."],
  [39, "RG", "se aferra a objetos, paredes o barandillas más que otros niños(as) de la misma edad."],
  [40, "RG", "hace ruido al caminar como si le pesaran los pies."],
  [41, "SK", "se estira echándose sobre muebles o encima de la gente."],
  [42, "-", "necesita cobijas/frazadas gruesas para dormir."],
  // Procesamiento sensorial oral
  [43, "-", "tiene el reflejo de vómito (por ejemplo, con la textura de la comida o los cubiertos en la boca)."],
  [44, "SN", "rechaza ciertos sabores u olores de comida que forman parte de la dieta típica infantil."],
  [45, "SN", "solo come ciertos sabores (por ejemplo, dulce, salado)."],
  [46, "SN", "se limita a sí mismo(a) a solo ciertas texturas de comida."],
  [47, "SN", "es particular o exigente para comer, especialmente en lo que se refiere a la textura de la comida."],
  [48, "SK", "huele objetos que no son comida."],
  [49, "SK", "muestra una fuerte preferencia hacia ciertos sabores."],
  [50, "SK", "se le antojan ciertos alimentos, sabores u olores."],
  [51, "SK", "se mete objetos a la boca (por ejemplo, lápiz, las manos)."],
  [52, "SN", "se muerde la lengua o los labios, más que otros niños(as) de su misma edad."],
  // Conducta
  [53, "RG", "parece ser propenso(a) a los accidentes."],
  [54, "RG", "se apresura cuando pinta, escribe o dibuja."],
  [55, "SK", "toma riesgos excesivos comprometiendo su propia seguridad (por ejemplo, se trepa en un árbol alto, brinca de muebles altos)."],
  [56, "SK", "parece ser más activo(a) que otros niños(as) de su misma edad."],
  [57, "RG", "hace las cosas más difíciles de lo que es necesario (por ejemplo, desperdicia el tiempo, se mueve con lentitud)."],
  [58, "AV", "puede ser terco(a)/necio(a) y poco cooperativo(a)."],
  [59, "AV", "hace berrinches."],
  [60, "SK", "parece disfrutar de las caídas."],
  [61, "AV", "se resiste al contacto visual mío o de los demás."],
  // Respuestas emocionales/sociales
  [62, "RG", "parece tener una baja autoestima (por ejemplo, dificultad para sentirse bien consigo mismo[a])."],
  [63, "AV", "requiere de apoyo positivo para responder a situaciones desafiantes."],
  [64, "AV", "es sensible a las críticas."],
  [65, "AV", "tiene miedos predecibles y definidos."],
  [66, "AV", "manifiesta sentirse como un fracaso."],
  [67, "AV", "es muy serio(a)."],
  [68, "AV", "tiene fuertes arrebatos emocionales cuando no puede completar una tarea."],
  [69, "SN", "le cuesta trabajo interpretar el lenguaje corporal o las expresiones faciales."],
  [70, "AV", "se frustra fácilmente."],
  [71, "AV", "tiene temores que interfieren con la rutina cotidiana."],
  [72, "AV", "se angustia cuando hay cambios en los planes, rutinas o expectativas."],
  [73, "SN", "necesita más protección de la vida que otros niños(as) de su misma edad (por ejemplo, es indefenso(a) física o emocionalmente)."],
  [74, "AV", "interactúa o participa en grupos menos que otros niños(as) de su misma edad."],
  [75, "AV", "tiene dificultades con las amistades (por ejemplo, hacer o retener amigos)."],
  // Respuestas de atención
  [76, "RG", "tiene muy poco contacto visual conmigo durante nuestras interacciones diarias."],
  [77, "SN", "tiene dificultad para poner atención."],
  [78, "SN", "aparta la vista de sus tareas para observar todas las actividades en la habitación."],
  [79, "RG", "parece no estar consciente de un ambiente activo (por ejemplo, no se da cuenta de las actividades que ocurren)."],
  [80, "RG", "mira fijamente a los objetos."],
  [81, "AV", "mira fijamente a las personas."],
  [82, "SK", "observa a todas las personas que se mueven alrededor de la habitación."],
  [83, "SK", "brinca de una cosa a otra, a tal grado que interfiere con las actividades."],
  [84, "SN", "se pierde fácilmente."],
  [85, "RG", "le cuesta trabajo encontrar cosas en situaciones que complican el problema (por ejemplo, zapatos en un cuarto desordenado, lápiz en un cajón lleno de trastos o trebejos)."],
  [86, "RG", "parece no darse cuenta cuando las personas entran a la habitación."],
].map(([id, quad, text]) => ({ id, quad, text }));

const ITEMS_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// Secciones: clave, encabezado del cuestionario, título, nombre corto, ítems que
// cuentan para la puntuación cruda, ítems adicionales (solo cuentan para el
// cuadrante), puntaje máximo, descripción y grupo (sensorial o conductual).
const SECTIONS = [
  { key: "AUDITIVO", header: "PROCESAMIENTO AUDITIVO", title: "Procesamiento Auditivo", short: "Auditivo", group: "Sensorial",
    main: range(1, 8), extra: [], max: 40,
    help: "Respuestas del niño(a) a la estimulación sonora del ambiente y a las demandas de escucha y atención auditiva." },
  { key: "VISUAL", header: "PROCESAMIENTO VISUAL", title: "Procesamiento Visual", short: "Visual", group: "Sensorial",
    main: range(9, 14), extra: [15], max: 30,
    help: "Respuestas del niño(a) a la estimulación visual (iluminación, colores, detalles) y a la búsqueda de objetos." },
  { key: "TACTIL", header: "PROCESAMIENTO TÁCTIL", title: "Procesamiento Táctil", short: "Táctil", group: "Sensorial",
    main: range(16, 26), extra: [], max: 55,
    help: "Respuestas del niño(a) al contacto físico, las texturas, el dolor, la temperatura y la limpieza personal." },
  { key: "MOVIMIENTO", header: "PROCESAMIENTO DE MOVIMIENTO", title: "Procesamiento de Movimiento", short: "Movimiento", group: "Sensorial",
    main: range(27, 34), extra: [], max: 40,
    help: "Respuestas del niño(a) al movimiento propio, el equilibrio y la búsqueda o evitación de actividades de movimiento." },
  { key: "POSICION", header: "PROCESAMIENTO DE POSICIÓN DEL CUERPO", title: "Procesamiento de Posición del Cuerpo", short: "Posición del Cuerpo", group: "Sensorial",
    main: range(35, 42), extra: [], max: 40,
    help: "Respuestas relacionadas con la propiocepción: tono muscular, postura, fuerza, resistencia y necesidad de apoyo corporal." },
  { key: "ORAL", header: "PROCESAMIENTO SENSORIAL ORAL", title: "Procesamiento Sensorial Oral", short: "Sensorial Oral", group: "Sensorial",
    main: range(43, 52), extra: [], max: 50,
    help: "Respuestas del niño(a) a sabores, olores, texturas de comida y conductas orales." },
  { key: "CONDUCTA", header: "CONDUCTA ASOCIADA CON EL PROCESAMIENTO SENSORIAL", title: "Conducta asociada con el procesamiento sensorial", short: "Conducta", group: "Conductual",
    main: range(53, 61), extra: [], max: 45,
    help: "Conductas observables asociadas con el procesamiento sensorial (nivel de actividad, riesgos, cooperación, accidentes)." },
  { key: "EMOCIONAL", header: "RESPUESTAS EMOCIONALES/SOCIALES ASOCIADAS CON EL PROCESAMIENTO SENSORIAL", title: "Respuestas Emocionales/Sociales", short: "Emocional/Social", group: "Conductual",
    main: range(62, 75), extra: [], max: 70,
    help: "Respuestas emocionales y sociales asociadas con el procesamiento sensorial (autoestima, frustración, miedos, amistades)." },
  { key: "ATENCION", header: "RESPUESTAS DE ATENCIÓN ASOCIADAS CON EL PROCESAMIENTO SENSORIAL", title: "Respuestas de Atención", short: "Atención", group: "Conductual",
    main: range(76, 85), extra: [86], max: 50,
    help: "Respuestas de atención asociadas con el procesamiento sensorial (distracción, mirada, búsqueda de objetos, conciencia del entorno)." },
];

// Cuadrantes (modelo de Dunn): ítems y puntaje máximo según la grilla del protocolo.
const QUADRANTS = buildQuadrants({
  SK: { items: [14, 21, 22, 25, 27, 28, 30, 31, 32, 41, 48, 49, 50, 51, 55, 56, 60, 82, 83], max: 95 },
  AV: { items: [1, 2, 5, 15, 18, 58, 59, 61, 63, 64, 65, 66, 67, 68, 70, 71, 72, 74, 75, 81], max: 100 },
  SN: { items: [3, 4, 6, 7, 9, 13, 16, 19, 20, 44, 45, 46, 47, 52, 69, 73, 77, 78, 84], max: 95 },
  RG: { items: [8, 12, 23, 24, 26, 33, 34, 35, 36, 37, 38, 39, 40, 53, 54, 57, 62, 76, 79, 80, 85, 86], max: 110 },
});

// Rangos normativos (límite inferior de cada banda) según la tabla
// "Summary Scores" del Child Sensory Profile 2. En "Sensorial oral" la banda
// "Mucho Menos" no tiene puntajes (**): su límite -1 nunca se alcanza.
const RANGES = {
  SK: { max: 95, lows: [0, 7, 20, 48, 61], disp: ["0-6", "7-19", "20-47", "48-60", "61-95"] },
  AV: { max: 100, lows: [0, 8, 21, 47, 60], disp: ["0-7", "8-20", "21-46", "47-59", "60-100"] },
  SN: { max: 95, lows: [0, 7, 18, 43, 54], disp: ["0-6", "7-17", "18-42", "43-53", "54-95"] },
  RG: { max: 110, lows: [0, 7, 19, 44, 56], disp: ["0-6", "7-18", "19-43", "44-55", "56-110"] },
  AUDITIVO: { max: 40, lows: [0, 3, 10, 25, 32], disp: ["0-2", "3-9", "10-24", "25-31", "32-40"] },
  VISUAL: { max: 30, lows: [0, 5, 9, 18, 22], disp: ["0-4", "5-8", "9-17", "18-21", "22-30"] },
  TACTIL: { max: 55, lows: [0, 1, 8, 22, 29], disp: ["0", "1-7", "8-21", "22-28", "29-55"] },
  MOVIMIENTO: { max: 40, lows: [0, 2, 7, 19, 25], disp: ["0-1", "2-6", "7-18", "19-24", "25-40"] },
  POSICION: { max: 40, lows: [0, 1, 5, 16, 20], disp: ["0", "1-4", "5-15", "16-19", "20-40"] },
  ORAL: { max: 50, lows: [-1, 0, 8, 25, 33], disp: ["N/D", "0-7", "8-24", "25-32", "33-50"] },
  CONDUCTA: { max: 45, lows: [0, 2, 9, 23, 30], disp: ["0-1", "2-8", "9-22", "23-29", "30-45"] },
  EMOCIONAL: { max: 70, lows: [0, 3, 13, 32, 42], disp: ["0-2", "3-12", "13-31", "32-41", "42-70"] },
  ATENCION: { max: 50, lows: [0, 1, 9, 25, 32], disp: ["0", "1-8", "9-24", "25-31", "32-50"] },
};

const RECOMMENDATIONS = [
  "Revise primero los cuatro cuadrantes: indican el patrón general de autorregulación sensorial del niño(a) (búsqueda, evitación, sensibilidad, registro).",
  "Cruce los cuadrantes con las secciones sensoriales (auditivo, visual, táctil, movimiento, posición del cuerpo, oral) y conductuales (conducta, emocional/social, atención) para identificar en qué áreas se concentran las diferencias encontradas.",
  "Considere el contexto del desarrollo típico de 3 a 14 años, el entorno escolar, la historia clínica y otros antecedentes registrados en los datos del niño(a).",
  "Use los comentarios cualitativos del cuidador(a) en cada sección como información complementaria a los puntajes.",
  "Los resultados de esta herramienta son un apoyo al razonamiento clínico; la interpretación final y las recomendaciones de intervención corresponden al criterio del profesional tratante.",
];

// Campos de la pantalla "Datos del niño(a)". `xlsxLabel` es la etiqueta usada en el Excel;
// `group` agrupa los campos en el Excel (sin encabezado, "personal" o "contexto").
const CHILD_FIELDS = [
  { key: "nombre", label: "Nombre(s) del niño(a)", type: "text", xlsxLabel: "Nombre(s) del niño(a):" },
  { key: "apellido", label: "Apellido", type: "text", xlsxLabel: "Apellido:" },
  { key: "nombrePreferido", label: "Nombre preferido (si es diferente)", type: "text", xlsxLabel: "Nombre preferido del niño(a) (si es diferente):" },
  { key: "id", label: "Número de ID", type: "text", xlsxLabel: "Número de ID:" },
  { key: "sexo", label: "Sexo", type: "pill", options: ["Masculino", "Femenino"], xlsxLabel: "Sexo:" },
  { key: "fechaNacimiento", label: "Fecha de nacimiento", type: "date", xlsxLabel: "Fecha de nacimiento:" },
  { key: "fechaPrueba", label: "Fecha de la prueba", type: "date", xlsxLabel: "Fecha de la prueba:" },
  { key: "examinador", profesional: true, label: "Nombre del examinador(a)/proveedor(a)", type: "text", group: "personal", xlsxLabel: "Nombre del examinador(a)/proveedor(a) de servicios:" },
  { key: "profesion", profesional: true, label: "Profesión del examinador(a)", type: "text", group: "personal", xlsxLabel: "Profesión del examinador(a)/proveedor(a) de servicios:" },
  { key: "persona", label: "Persona que llenó la forma", type: "text", group: "personal", xlsxLabel: "Nombre de la persona que llenó la forma/persona encargada de cuidar al niño(a):" },
  { key: "relacion", label: "Relación con el niño(a)", type: "text", group: "personal", xlsxLabel: "Relación con el niño(a):" },
  { key: "escuela", label: "Nombre de la escuela/guardería", type: "text", group: "contexto", xlsxLabel: "Nombre de la escuela/guardería:" },
  { key: "grado", label: "Grado escolar", type: "text", group: "contexto", xlsxLabel: "Grado escolar:" },
  { key: "orden", label: "¿En qué orden nació en comparación con sus hermanos(as)?", type: "select",
    options: ["Hijo(a) único(a)", "Primero(a)", "Segundo(a)", "Tercero(a)", "Cuarto(a)", "Quinto(a)", "Otro"], group: "contexto",
    xlsxLabel: "¿En qué orden nació su niño(a) en comparación con sus hermanos(as)?:" },
  { key: "masTresNinos", label: "¿Ha habido más de tres niños(as) entre las edades de nacimiento a 18 años viviendo en su hogar en los últimos 12 meses?",
    type: "pill", options: ["Sí", "No"], span2: true, group: "contexto",
    xlsxLabel: "¿Ha habido más de tres niños(as) entre las edades de nacimiento a 18 años viviendo en su hogar en los últimos 12 meses?:" },
];
