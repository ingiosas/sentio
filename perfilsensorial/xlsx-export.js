/* ==========================================================================
   Generación del archivo Excel diligenciado (.xlsx) a partir de las
   respuestas capturadas en la aplicación web. Reproduce la misma
   estructura, fórmulas y clasificación de la plantilla original
   "Perfil Sensorial Toddler 7-35 meses - Plantilla.xlsx".
   ========================================================================== */

const XLSX_COLORS = {
  navy: "FF1F3864",
  blue: "FF2E5395",
  lightBlue: "FFD9E2F3",
  gray: "FFF2F2F2",
  input: "FFFFF2CC",
  subtotal: "FFFCE4D6",
  sk: "FFF4B183",
  av: "FF8EA9DB",
  sn: "FFA9D18E",
  rg: "FFD999A2",
  none: "FFE7E6E6",
  white: "FFFFFFFF",
};

const QUAD_FILL_XLSX = { SK: XLSX_COLORS.sk, AV: XLSX_COLORS.av, SN: XLSX_COLORS.sn, RG: XLSX_COLORS.rg, "-": XLSX_COLORS.none };
const QUAD_FONT_COLOR_XLSX = { SK: "FF000000", AV: "FFFFFFFF", SN: "FF000000", RG: "FFFFFFFF", "-": "FF808080" };

const SCORE_TO_LABEL = Object.fromEntries(RESPONSE_OPTIONS.map((o) => [o.score, o.label]));

const thinBorder = {
  top: { style: "thin", color: { argb: "FFBFBFBF" } },
  left: { style: "thin", color: { argb: "FFBFBFBF" } },
  bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
  right: { style: "thin", color: { argb: "FFBFBFBF" } },
};

function dateOnlyUTC(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

function fill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function mergeAndSet(ws, row, colStart, colEnd, value, opts) {
  const ref = `${colLetter(colStart)}${row}:${colLetter(colEnd)}${row}`;
  ws.mergeCells(ref);
  const cell = ws.getCell(row, colStart);
  cell.value = value;
  Object.assign(cell, opts || {});
  return cell;
}

function colLetter(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function banner(ws, row, title, subtitle, span) {
  const c1 = mergeAndSet(ws, row, 1, span, title, {
    font: { name: "Calibri", size: 16, bold: true, color: { argb: XLSX_COLORS.white } },
    fill: fill(XLSX_COLORS.navy),
    alignment: { vertical: "middle", horizontal: "left", indent: 1 },
  });
  ws.getRow(row).height = 28;
  for (let c = 1; c <= span; c++) ws.getCell(row, c).fill = fill(XLSX_COLORS.navy);
  if (subtitle) {
    mergeAndSet(ws, row + 1, 1, span, subtitle, {
      font: { name: "Calibri", size: 11, italic: true, color: { argb: XLSX_COLORS.white } },
      fill: fill(XLSX_COLORS.blue),
      alignment: { vertical: "middle", horizontal: "left", indent: 1 },
    });
    ws.getRow(row + 1).height = 18;
    for (let c = 1; c <= span; c++) ws.getCell(row + 1, c).fill = fill(XLSX_COLORS.blue);
    return row + 2;
  }
  return row + 2;
}

/* -------------------------------------------------------------------- */
/* Construcción del libro                                               */
/* -------------------------------------------------------------------- */

async function buildWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Perfil Sensorial 2 - App Web";
  wb.created = new Date();

  buildListasSheet(wb);
  buildInstruccionesSheet(wb);
  buildDatosSheet(wb);
  const { itemScoreCell, sectionSubtotalCell } = buildCuestionarioSheet(wb);
  const { quadTotalCell } = buildCuadrantesSheet(wb, itemScoreCell);
  const resumenInfo = buildResumenSheet(wb, sectionSubtotalCell, quadTotalCell);
  await buildGraficasSheet(wb, resumenInfo);
  buildInterpretacionSheet(wb);

  return wb;
}

function buildListasSheet(wb) {
  const ws = wb.addWorksheet("Listas", { state: "veryHidden" });
  ws.getCell("A1").value = "Respuesta";
  ws.getCell("B1").value = "Puntaje";
  ws.getCell("C1").value = "Descripción";
  RESPONSE_OPTIONS.forEach((o, i) => {
    ws.getCell(i + 2, 1).value = o.label;
    ws.getCell(i + 2, 2).value = o.score;
    ws.getCell(i + 2, 3).value = o.sub;
  });
  ws.columns = [{ width: 22 }, { width: 8 }, { width: 40 }];
}

function buildInstruccionesSheet(wb) {
  const ws = wb.addWorksheet("Instrucciones");
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 3 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 3 }];
  let row = banner(
    ws,
    1,
    "PERFIL SENSORIAL DEL BEBÉ / NIÑO PEQUEÑO 2",
    "Toddler Sensory Profile 2 (Winnie Dunn, PhD - Pearson/PsychCorp) - Informe diligenciado a través de la aplicación web",
    6
  );
  row += 1;
  mergeAndSet(ws, row, 2, 6, "Este archivo fue generado automáticamente a partir de las respuestas capturadas en la aplicación web del Perfil Sensorial 2.", {
    font: { name: "Calibri", size: 11 },
    alignment: { wrapText: true, vertical: "middle" },
  });
  ws.getRow(row).height = 30;
  row += 2;
  mergeAndSet(
    ws,
    row,
    2,
    6,
    "Las hojas 'Cuestionario', 'Cuadrantes' y 'Resumen y Clasificación' contienen fórmulas activas: si el " +
      "profesional corrige alguna respuesta directamente en Excel, los totales y la clasificación se recalculan solos.",
    { font: { name: "Calibri", size: 10, italic: true, color: { argb: "FF595959" } }, alignment: { wrapText: true, vertical: "middle" } }
  );
  ws.getRow(row).height = 45;
  row += 2;

  mergeAndSet(ws, row, 2, 3, "Fecha de generación del informe:", { font: { name: "Calibri", size: 10, bold: true } });
  ws.getCell(row, 4).value = new Date();
  ws.getCell(row, 4).numFmt = "dd/mm/yyyy hh:mm";
  row += 2;

  mergeAndSet(ws, row, 2, 6, "Escala de respuesta utilizada:", { font: { name: "Calibri", size: 12, bold: true, color: { argb: "FF1F3864" } } });
  row += 1;
  ws.getCell(row, 2).value = "Respuesta";
  ws.getCell(row, 3).value = "Puntaje";
  mergeAndSet(ws, row, 4, 6, "Significado", {});
  for (let c = 2; c <= 6; c++) {
    ws.getCell(row, c).font = { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } };
    ws.getCell(row, c).fill = fill(XLSX_COLORS.blue);
    ws.getCell(row, c).alignment = { horizontal: "center" };
  }
  row += 1;
  RESPONSE_OPTIONS.forEach((o) => {
    ws.getCell(row, 2).value = o.label;
    ws.getCell(row, 3).value = o.score;
    ws.getCell(row, 3).alignment = { horizontal: "center" };
    mergeAndSet(ws, row, 4, 6, o.sub, {});
    for (let c = 2; c <= 6; c++) ws.getCell(row, c).border = thinBorder;
    row += 1;
  });
}

function buildDatosSheet(wb) {
  const ws = wb.addWorksheet("Datos del Niño");
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 4 }, { width: 40 }, { width: 26 }, { width: 6 }, { width: 26 }, { width: 26 }, { width: 4 }];
  let row = banner(ws, 1, "DATOS DE IDENTIFICACIÓN", "Cuestionario para padres o tutores - 7 a 35 meses", 6);
  row += 1;

  const c = state.child;
  const field = (label, value, opts) => {
    ws.getCell(row, 2).value = label;
    ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true };
    ws.getCell(row, 2).alignment = { wrapText: true, vertical: "middle" };
    if (label.length > 45) ws.getRow(row).height = 28;
    const span = (opts && opts.span) || 2;
    if (span > 1) ws.mergeCells(row, 3, row, 2 + span);
    const vc = ws.getCell(row, 3);
    vc.value = value || "";
    vc.font = { name: "Calibri", size: 10, color: { argb: "FF1F4E78" }, bold: true };
    vc.fill = fill(XLSX_COLORS.input);
    vc.border = thinBorder;
    if (opts && opts.numFmt) vc.numFmt = opts.numFmt;
    row += 1;
  };

  field("Nombre(s) del niño(a):", c.nombre);
  field("Apellido:", c.apellido);
  field("Nombre preferido del niño(a) (si es diferente):", c.nombrePreferido);
  field("Número de ID:", c.id);
  field("Sexo:", c.sexo);
  const fnac = c.fechaNacimiento ? dateOnlyUTC(c.fechaNacimiento) : "";
  const fprueba = c.fechaPrueba ? dateOnlyUTC(c.fechaPrueba) : "";
  field("Fecha de nacimiento:", fnac, { numFmt: "dd/mm/yyyy" });
  const fnacRow = row - 1;
  field("Fecha de la prueba:", fprueba, { numFmt: "dd/mm/yyyy" });
  const fpruebaRow = row - 1;
  row += 1;

  mergeAndSet(ws, row, 2, 5, "Personal a cargo de la evaluación", {
    font: { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } },
    fill: fill(XLSX_COLORS.blue),
  });
  for (let cc = 2; cc <= 5; cc++) ws.getCell(row, cc).fill = fill(XLSX_COLORS.blue);
  row += 1;
  field("Nombre del examinador(a)/proveedor(a) de servicios:", c.examinador);
  field("Profesión del examinador(a)/proveedor(a) de servicios:", c.profesion);
  field("Nombre de la persona que llenó la forma:", c.persona);
  field("Relación con el niño(a):", c.relacion);
  field("Nombre de la guardería:", c.guarderia);
  row += 1;

  mergeAndSet(ws, row, 2, 5, "Antecedentes", {
    font: { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } },
    fill: fill(XLSX_COLORS.blue),
  });
  for (let cc = 2; cc <= 5; cc++) ws.getCell(row, cc).fill = fill(XLSX_COLORS.blue);
  row += 1;
  field("¿Nació su niño(a) prematuramente?:", c.prematuro);
  field("Si sí, ¿cuántas semanas antes?:", c.semanasAntes);
  field("Orden de nacimiento entre hermanos(as):", c.orden);
  field("¿Más de 3 niños(as) de 0-18 años vivieron en el hogar en los últimos 12 meses?:", c.masTresNinos, { span: 1 });
  row += 2;

  mergeAndSet(ws, row, 2, 5, "Cálculo de la edad del niño(a)", {
    font: { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } },
    fill: fill(XLSX_COLORS.blue),
  });
  for (let cc = 2; cc <= 5; cc++) ws.getCell(row, cc).fill = fill(XLSX_COLORS.blue);
  row += 2;
  ["", "Años", "Meses", "Días"].forEach((h, i) => {
    const cell = ws.getCell(row, 2 + i);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true };
    cell.alignment = { horizontal: "center" };
    cell.fill = fill(XLSX_COLORS.lightBlue);
    cell.border = thinBorder;
  });
  row += 1;
  ws.getCell(row, 2).value = "Edad calculada (a partir de fechas de arriba)";
  const fnacRef = `$C$${fnacRow}`;
  const fpruebaRef = `$C$${fpruebaRow}`;
  const age = calcAge(c.fechaNacimiento, c.fechaPrueba);
  const ageFormula = (unit) => `IF(OR(${fnacRef}="",${fpruebaRef}=""),"",DATEDIF(${fnacRef},${fpruebaRef},"${unit}"))`;
  ws.getCell(row, 3).value = { formula: ageFormula("y"), result: age ? age.years : "" };
  ws.getCell(row, 4).value = { formula: ageFormula("ym"), result: age ? age.months : "" };
  ws.getCell(row, 5).value = { formula: ageFormula("md"), result: age ? age.days : "" };
  for (let cc = 3; cc <= 5; cc++) {
    ws.getCell(row, cc).alignment = { horizontal: "center" };
    ws.getCell(row, cc).border = thinBorder;
    ws.getCell(row, cc).fill = fill(XLSX_COLORS.gray);
  }
}

function buildCuestionarioSheet(wb) {
  const ws = wb.addWorksheet("Cuestionario");
  ws.views = [{ showGridLines: false, state: "frozen", ySplit: 3 }];
  ws.columns = [{ width: 11 }, { width: 6 }, { width: 66 }, { width: 20 }, { width: 9 }];
  let row = banner(ws, 1, "CUESTIONARIO - RESPUESTAS DEL CUIDADOR(A)", "Respuestas capturadas a través de la aplicación web.", 5);
  row += 1;

  const itemScoreCell = {};
  const sectionSubtotalCell = {};

  const colHeader = () => {
    ["Cuadrante", "Ítem", "Mi niño(a)...", "Respuesta", "Puntaje"].forEach((lab, i) => {
      const cell = ws.getCell(row, 1 + i);
      cell.value = lab;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } };
      cell.fill = fill(XLSX_COLORS.blue);
      cell.alignment = { horizontal: "center" };
      cell.border = thinBorder;
    });
    ws.getRow(row).height = 16;
    row += 1;
  };

  const writeItemRow = (id, isExtra) => {
    const item = ITEMS_BY_ID[id];
    const qc = ws.getCell(row, 1);
    qc.value = item.quad === "-" ? "-" : item.quad;
    qc.fill = fill(QUAD_FILL_XLSX[item.quad]);
    qc.font = { name: "Calibri", size: 9, bold: true, color: { argb: QUAD_FONT_COLOR_XLSX[item.quad] } };
    qc.alignment = { horizontal: "center" };
    qc.border = thinBorder;

    const nc = ws.getCell(row, 2);
    nc.value = id;
    nc.alignment = { horizontal: "center" };
    nc.border = thinBorder;

    const tc = ws.getCell(row, 3);
    tc.value = item.text + (isExtra ? "  (*)" : "");
    tc.font = { name: "Calibri", size: 10, italic: !!isExtra };
    tc.alignment = { wrapText: true, vertical: "middle" };
    tc.border = thinBorder;

    const score = state.answers[id];
    const rc = ws.getCell(row, 4);
    rc.value = typeof score === "number" ? SCORE_TO_LABEL[score] : "";
    rc.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1F4E78" } };
    rc.fill = fill(XLSX_COLORS.input);
    rc.alignment = { horizontal: "center" };
    rc.border = thinBorder;
    rc.dataValidation = {
      type: "list",
      formulae: ["=Listas!$A$2:$A$7"],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: "Respuesta inválida",
      error: "Seleccione una opción de la lista desplegable.",
    };

    const sc = ws.getCell(row, 5);
    sc.value = {
      formula: `IFERROR(INDEX(Listas!$B$2:$B$7,MATCH($D${row},Listas!$A$2:$A$7,0)),"")`,
      result: typeof score === "number" ? score : "",
    };
    sc.alignment = { horizontal: "center" };
    sc.border = thinBorder;
    sc.fill = fill(XLSX_COLORS.gray);
    itemScoreCell[id] = row;
    row += 1;
  };

  SECTIONS.forEach((section) => {
    const headerLabel =
      section.key === "COMPORTAMIENTO"
        ? `RESPUESTAS DE ${section.key} ASOCIADAS AL PROCESAMIENTO SENSORIAL`
        : `PROCESAMIENTO ${section.key === "ORAL" ? "SENSORIAL ORAL" : section.key}`;
    mergeAndSet(ws, row, 1, 5, headerLabel, {
      font: { name: "Calibri", size: 12, bold: true, color: { argb: XLSX_COLORS.white } },
      fill: fill(XLSX_COLORS.navy),
      alignment: { vertical: "middle", horizontal: "left", indent: 1 },
    });
    for (let c = 1; c <= 5; c++) ws.getCell(row, c).fill = fill(XLSX_COLORS.navy);
    ws.getRow(row).height = 20;
    row += 1;

    colHeader();
    section.main.forEach((id) => writeItemRow(id, false));

    const rng = section.main.map((id) => `E${itemScoreCell[id]}`).join(",");
    const rawResult = sumScores(section.main);
    mergeAndSet(ws, row, 1, 4, `${section.key === "ORAL" ? "SENSORIAL ORAL" : section.key} Puntuación cruda (máximo ${section.max})`, {
      font: { name: "Calibri", size: 10, bold: true },
      alignment: { horizontal: "right", vertical: "middle", indent: 1 },
      fill: fill(XLSX_COLORS.subtotal),
    });
    for (let c = 1; c <= 4; c++) ws.getCell(row, c).border = thinBorder;
    const totalCell = ws.getCell(row, 5);
    totalCell.value = { formula: `SUM(${rng})`, result: rawResult };
    totalCell.font = { name: "Calibri", size: 10, bold: true };
    totalCell.alignment = { horizontal: "center" };
    totalCell.border = thinBorder;
    totalCell.fill = fill(XLSX_COLORS.subtotal);
    sectionSubtotalCell[section.key] = row;
    row += 1;

    if (section.extra.length) {
      row += 1;
      mergeAndSet(
        ws,
        row,
        1,
        5,
        "Los siguientes enunciados NO se suman a la puntuación cruda de esta sección; solo se utilizan para el total del cuadrante correspondiente (*)",
        { font: { name: "Calibri", size: 9, italic: true, color: { argb: "FF595959" } }, alignment: { wrapText: true } }
      );
      row += 1;
      colHeader();
      section.extra.forEach((id) => writeItemRow(id, true));
    }

    ws.getCell(row, 1).value = `Comentarios sobre ${shortLabel(section.title).toLowerCase()}:`;
    ws.getCell(row, 1).font = { name: "Calibri", size: 10, bold: true };
    row += 1;
    mergeAndSet(ws, row, 1, 5, state.comments[section.key] || "", {
      fill: fill(XLSX_COLORS.input),
      border: thinBorder,
      alignment: { wrapText: true, vertical: "top" },
    });
    ws.getRow(row).height = 32;
    row += 2;
  });

  return { itemScoreCell, sectionSubtotalCell };
}

function buildCuadrantesSheet(wb, itemScoreCell) {
  const ws = wb.addWorksheet("Cuadrantes");
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 4 }, { width: 30 }, { width: 10 }, { width: 12 }, { width: 30 }, { width: 10 }, { width: 12 }, { width: 4 }];
  let row = banner(ws, 1, "RESUMEN POR CUADRANTE", "Los puntajes de cada ítem se traen automáticamente desde la hoja 'Cuestionario'.", 7);
  row += 1;

  const quadTotalCell = {};
  const colPairs = [
    [2, 3],
    [5, 6],
  ];
  const startRow = row;
  const maxLen = Math.max(...QUADRANTS.map((q) => q.items.length));

  QUADRANTS.forEach((quad, idx) => {
    const block = idx % 2;
    const baseRow = startRow + Math.floor(idx / 2) * (maxLen + 6);
    const [colItem, colScore] = colPairs[block];

    const label = `${quad.title} / ${quad.subtitle} (${quad.key})`;
    ws.mergeCells(baseRow, colItem, baseRow, colScore);
    const hc = ws.getCell(baseRow, colItem);
    hc.value = label;
    hc.font = { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } };
    hc.fill = fill(XLSX_COLORS.blue);
    hc.alignment = { horizontal: "center" };

    let r = baseRow + 1;
    ws.getCell(r, colItem).value = "Ítem";
    ws.getCell(r, colScore).value = "Puntaje";
    [colItem, colScore].forEach((cc) => {
      ws.getCell(r, cc).fill = fill(XLSX_COLORS.lightBlue);
      ws.getCell(r, cc).border = thinBorder;
      ws.getCell(r, cc).font = { name: "Calibri", size: 10, bold: true };
      ws.getCell(r, cc).alignment = { horizontal: "center" };
    });
    r += 1;

    const scoreCells = [];
    quad.items.forEach((itemId) => {
      ws.getCell(r, colItem).value = itemId;
      ws.getCell(r, colItem).alignment = { horizontal: "center" };
      ws.getCell(r, colItem).border = thinBorder;
      const scoreRow = itemScoreCell[itemId];
      const sc = ws.getCell(r, colScore);
      const val = typeof state.answers[itemId] === "number" ? state.answers[itemId] : "";
      sc.value = { formula: `Cuestionario!E${scoreRow}`, result: val };
      sc.alignment = { horizontal: "center" };
      sc.border = thinBorder;
      sc.fill = fill(XLSX_COLORS.gray);
      scoreCells.push(`${colLetter(colScore)}${r}`);
      r += 1;
    });

    ws.mergeCells(r, colItem, r, colItem);
    const tl = ws.getCell(r, colItem);
    tl.value = `Total (máx. ${quad.max})`;
    tl.font = { name: "Calibri", size: 10, bold: true };
    tl.fill = fill(XLSX_COLORS.subtotal);
    tl.border = thinBorder;
    tl.alignment = { horizontal: "right", vertical: "middle", indent: 1 };
    const tot = ws.getCell(r, colScore);
    tot.value = { formula: `SUM(${scoreCells.join(",")})`, result: sumScores(quad.items) };
    tot.font = { name: "Calibri", size: 10, bold: true };
    tot.fill = fill(XLSX_COLORS.subtotal);
    tot.border = thinBorder;
    tot.alignment = { horizontal: "center" };
    quadTotalCell[quad.key] = `Cuadrantes!${colLetter(colScore)}${r}`;
  });

  return { quadTotalCell };
}

function buildResumenSheet(wb, sectionSubtotalCell, quadTotalCell) {
  const ws = wb.addWorksheet("Resumen y Clasificación");
  ws.views = [{ showGridLines: false, state: "frozen", ySplit: 8 }];
  ws.columns = [
    { width: 2 }, { width: 30 }, { width: 11 }, { width: 11 }, { width: 24 }, { width: 30 },
    { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 },
  ];
  let row = banner(
    ws,
    1,
    "RESUMEN DE PUNTUACIONES Y CLASIFICACIÓN",
    "Puntajes crudos calculados automáticamente. La clasificación usa los rangos normativos del Sensory Profile 2.",
    11
  );
  row += 1;

  const c = state.child;
  ws.getCell(row, 2).value = "Niño(a):";
  ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true };
  ws.mergeCells(row, 3, row, 6);
  ws.getCell(row, 3).value = [c.nombre, c.apellido].filter(Boolean).join(" ");
  ws.getCell(row, 3).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1F4E78" } };
  row += 1;
  ws.getCell(row, 2).value = "Fecha de la prueba:";
  ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true };
  ws.mergeCells(row, 3, row, 6);
  if (c.fechaPrueba) {
    ws.getCell(row, 3).value = dateOnlyUTC(c.fechaPrueba);
    ws.getCell(row, 3).numFmt = "dd/mm/yyyy";
  }
  ws.getCell(row, 3).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1F4E78" } };
  row += 2;

  const headerRow = (labels) => {
    labels.forEach((lab, i) => {
      const cell = ws.getCell(row, 2 + i);
      cell.value = lab;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } };
      cell.fill = fill(XLSX_COLORS.blue);
      cell.alignment = { horizontal: "center", wrapText: true, vertical: "middle" };
      cell.border = thinBorder;
    });
    ws.getRow(row).height = 30;
    row += 1;
  };

  const writeTable = (title, entries, getResult) => {
    mergeAndSet(ws, row, 2, 11, title, {
      font: { name: "Calibri", size: 12, bold: true, color: { argb: XLSX_COLORS.white } },
      fill: fill(XLSX_COLORS.navy),
      alignment: { vertical: "middle", horizontal: "left", indent: 1 },
    });
    for (let c2 = 2; c2 <= 11; c2++) ws.getCell(row, c2).fill = fill(XLSX_COLORS.navy);
    ws.getRow(row).height = 22;
    row += 1;
    headerRow([
      "Cuadrante / Sección", "Puntaje\nmáximo", "Puntaje\nobtenido", "Mucho\nMenos", "Menos",
      "Igual a la\nMayoría", "Más", "Mucho\nMás", "Clasificación", "Nivel\n(1-5)",
    ]);
    const rowsInfo = [];
    entries.forEach(({ key, title: name, max, rawFormula, rawValue, answered }) => {
      ws.getCell(row, 2).value = name;
      ws.getCell(row, 2).alignment = { wrapText: true, vertical: "middle" };
      ws.getCell(row, 2).border = thinBorder;
      ws.getCell(row, 3).value = max;
      ws.getCell(row, 3).alignment = { horizontal: "center" };
      ws.getCell(row, 3).border = thinBorder;

      const rawCell = ws.getCell(row, 4);
      rawCell.value = { formula: rawFormula, result: rawValue };
      rawCell.font = { name: "Calibri", bold: true };
      rawCell.alignment = { horizontal: "center" };
      rawCell.fill = fill(XLSX_COLORS.subtotal);
      rawCell.border = thinBorder;

      const { disp, lows } = RANGES[key];
      disp.forEach((d, k) => {
        const cc = ws.getCell(row, 5 + k);
        cc.value = d;
        cc.alignment = { horizontal: "center" };
        cc.border = thinBorder;
      });

      const lowStartCol = 13;
      lows.forEach((low, k) => {
        ws.getCell(row, lowStartCol + k).value = low;
      });
      const lowRange = `$${colLetter(lowStartCol)}${row}:$${colLetter(lowStartCol + 4)}${row}`;
      const labelsLiteral = '{"' + LABELS_5.join('","') + '"}';
      const rawRef = `$D${row}`;

      const idx = answered ? classifyIndex(key, rawValue) : null;
      const clasCell = ws.getCell(row, 10);
      clasCell.value = {
        formula: `IF(${rawRef}="","Pendiente (sin respuestas)",INDEX(${labelsLiteral},MATCH(${rawRef},${lowRange},1)))`,
        result: answered ? LABELS_5[idx] : "Pendiente (sin respuestas)",
      };
      clasCell.font = { name: "Calibri", bold: true, color: { argb: "FF1F3864" } };
      clasCell.alignment = { horizontal: "center", wrapText: true };
      clasCell.fill = fill(XLSX_COLORS.lightBlue);
      clasCell.border = thinBorder;

      const nivelCell = ws.getCell(row, 11);
      nivelCell.value = { formula: `IF(${rawRef}="","",MATCH(${rawRef},${lowRange},1))`, result: answered ? idx + 1 : "" };
      nivelCell.alignment = { horizontal: "center" };
      nivelCell.border = thinBorder;

      rowsInfo.push({ key, row });
      row += 1;
    });
    row += 1;
    return rowsInfo;
  };

  const quadEntries = QUADRANTS.map((q) => {
    const r = getQuadrantResult(q);
    return { key: q.key, title: `${q.title} / ${q.subtitle} (${q.key})`, max: q.max, rawFormula: quadTotalCell[q.key], rawValue: r.raw, answered: r.answered };
  });
  const quadRows = writeTable("CUADRANTES SENSORIALES", quadEntries);

  const secEntries = SECTIONS.map((s) => {
    const r = getSectionResult(s);
    return { key: s.key, title: shortLabel(s.title).toUpperCase(), max: s.max, rawFormula: `Cuestionario!E${sectionSubtotalCell[s.key]}`, rawValue: r.raw, answered: r.answered };
  });
  const secRows = writeTable("SECCIONES SENSORIALES Y DE COMPORTAMIENTO", secEntries);

  for (let colIdx = 13; colIdx <= 17; colIdx++) ws.getColumn(colIdx).hidden = true;

  mergeAndSet(
    ws,
    row,
    2,
    11,
    "La clasificación se basa en las tablas normativas del protocolo original (Sensory Profile 2 User's Manual). 'N/D' indica que el protocolo no reporta un rango disponible para esa banda.",
    { font: { name: "Calibri", size: 9, italic: true, color: { argb: "FF595959" } }, alignment: { wrapText: true } }
  );
  row += 2;
  mergeAndSet(
    ws,
    row,
    2,
    11,
    "Percentiles: el protocolo remite a las tablas normativas del Apéndice A del Manual del Usuario del Sensory Profile 2; consulte dicho manual si necesita percentiles exactos.",
    { font: { name: "Calibri", size: 9, italic: true, color: { argb: "FF595959" } }, alignment: { wrapText: true } }
  );
  row += 2;

  return { quadRows, secRows, endRow: row };
}

async function buildGraficasSheet(wb, resumenInfo) {
  const ws = wb.addWorksheet("Gráficas");
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 2 }];
  let row = banner(ws, 1, "GRÁFICAS DE PERFIL SENSORIAL", "Generadas a partir de las respuestas capturadas en la aplicación web.", 12);
  row += 1;

  const charts = await renderChartImagesForExport();

  const img1 = wb.addImage({ base64: charts.quad.dataUrl, extension: "png" });
  ws.addImage(img1, { tl: { col: 1, row: row - 1 }, ext: { width: charts.quad.width / 2, height: charts.quad.height / 2 } });
  row += Math.ceil(charts.quad.height / 2 / 20) + 2;

  const img2 = wb.addImage({ base64: charts.sec.dataUrl, extension: "png" });
  ws.addImage(img2, { tl: { col: 1, row: row - 1 }, ext: { width: charts.sec.width / 2, height: charts.sec.height / 2 } });
  row += Math.ceil(charts.sec.height / 2 / 20) + 2;

  mergeAndSet(ws, row, 2, 8, "Cómo leer el nivel de clasificación:", {
    font: { name: "Calibri", size: 12, bold: true, color: { argb: "FF1F3864" } },
  });
  row += 1;
  ["1 = Mucho Menos que Otros", "2 = Menos que Otros", "3 = Igual que la Mayoría de Otros", "4 = Más que Otros", "5 = Mucho Más que Otros"].forEach((l) => {
    mergeAndSet(ws, row, 2, 8, l, { font: { name: "Calibri", size: 10 } });
    row += 1;
  });
}

function buildInterpretacionSheet(wb) {
  const ws = wb.addWorksheet("Interpretación");
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 3 }, { width: 24 }, { width: 78 }, { width: 3 }];
  let row = banner(ws, 1, "GUÍA DE INTERPRETACIÓN PARA EL PROFESIONAL", "Uso clínico de los cuadrantes y secciones del Perfil Sensorial del Bebé/Niño Pequeño 2.", 3);
  row += 1;

  mergeAndSet(ws, row, 2, 3, "El modelo de Dunn y la curva normal", { font: { name: "Calibri", size: 13, bold: true, color: { argb: "FF1F3864" } } });
  row += 1;
  mergeAndSet(
    ws,
    row,
    2,
    3,
    "Las puntuaciones se ubican en una curva normal. Los puntajes que se alejan una desviación estándar o más de la media se expresan como “Más que Otros” o “Menos que Otros”; los que se alejan dos desviaciones estándar o más se expresan como “Mucho Más que Otros” o “Mucho Menos que Otros”. Un puntaje “Igual que la Mayoría de Otros” indica un patrón típico para la edad.",
    { font: { name: "Calibri", size: 10 }, alignment: { wrapText: true, vertical: "middle" } }
  );
  ws.getRow(row).height = 55;
  row += 2;

  mergeAndSet(ws, row, 2, 3, "Definición de los cuatro cuadrantes (modelo de Dunn)", { font: { name: "Calibri", size: 13, bold: true, color: { argb: "FF1F3864" } } });
  row += 1;
  ws.getCell(row, 2).value = "Cuadrante";
  ws.getCell(row, 3).value = "Definición clínica";
  [2, 3].forEach((c) => {
    ws.getCell(row, c).font = { name: "Calibri", size: 11, bold: true, color: { argb: XLSX_COLORS.white } };
    ws.getCell(row, c).fill = fill(XLSX_COLORS.blue);
    ws.getCell(row, c).alignment = { horizontal: "center" };
  });
  row += 1;
  QUADRANTS.forEach((q) => {
    ws.getCell(row, 2).value = `${q.title} / ${q.subtitle} (${q.key})`;
    ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true };
    ws.getCell(row, 2).alignment = { wrapText: true, vertical: "middle" };
    ws.getCell(row, 2).border = thinBorder;
    ws.getCell(row, 3).value = q.def;
    ws.getCell(row, 3).font = { name: "Calibri", size: 10 };
    ws.getCell(row, 3).alignment = { wrapText: true, vertical: "middle" };
    ws.getCell(row, 3).border = thinBorder;
    ws.getRow(row).height = 55;
    row += 1;
  });
  row += 1;

  mergeAndSet(ws, row, 2, 3, "Recomendaciones para el análisis clínico", { font: { name: "Calibri", size: 13, bold: true, color: { argb: "FF1F3864" } } });
  row += 1;
  RECOMMENDATIONS.forEach((r, i) => {
    mergeAndSet(ws, row, 2, 3, `${i + 1}. ${r}`, { font: { name: "Calibri", size: 10 }, alignment: { wrapText: true, vertical: "middle" } });
    ws.getRow(row).height = 30;
    row += 1;
  });
  row += 1;

  mergeAndSet(ws, row, 2, 3, "Comentarios registrados por sección (aplicación web):", { font: { name: "Calibri", size: 11, bold: true } });
  row += 1;
  SECTIONS.forEach((s) => {
    const txt = state.comments[s.key];
    if (txt && txt.trim()) {
      ws.getCell(row, 2).value = shortLabel(s.title);
      ws.getCell(row, 2).font = { name: "Calibri", size: 10, bold: true };
      ws.getCell(row, 2).alignment = { vertical: "top" };
      ws.getCell(row, 3).value = txt;
      ws.getCell(row, 3).font = { name: "Calibri", size: 10 };
      ws.getCell(row, 3).alignment = { wrapText: true, vertical: "top" };
      ws.getRow(row).height = 34;
      row += 1;
    }
  });
  row += 1;

  mergeAndSet(ws, row, 2, 3, "Notas clínicas adicionales (uso libre del profesional):", { font: { name: "Calibri", size: 10, bold: true } });
  row += 1;
  ws.mergeCells(row, 2, row + 6, 3);
  const nb = ws.getCell(row, 2);
  nb.value = state.clinicalNotes || "";
  nb.fill = fill(XLSX_COLORS.input);
  nb.border = thinBorder;
  nb.alignment = { wrapText: true, vertical: "top", horizontal: "left" };
}

/* -------------------------------------------------------------------- */
/* Render de gráficas fuera de pantalla (para insertar como imagen)     */
/* -------------------------------------------------------------------- */

async function renderChartImagesForExport() {
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "fixed";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "0";
  tempDiv.innerHTML = `<div id="export-chart-quad"></div><div id="export-chart-sec"></div>`;
  document.body.appendChild(tempDiv);

  const quadCats = QUADRANTS.map((q) => `${q.title} / ${q.subtitle}`);
  const quadVals = QUADRANTS.map((q) => {
    const r = getQuadrantResult(q);
    return r.answered ? r.level : null;
  });
  renderLineChart("export-chart-quad", quadCats, quadVals, "#2e5395");

  const secCats = SECTIONS.map((s) => shortLabel(s.title));
  const secVals = SECTIONS.map((s) => {
    const r = getSectionResult(s);
    return r.answered ? r.level : null;
  });
  renderLineChart("export-chart-sec", secCats, secVals, "#70ad47");

  const quadSvg = tempDiv.querySelector("#export-chart-quad svg");
  const secSvg = tempDiv.querySelector("#export-chart-sec svg");

  const quad = await svgToPng(quadSvg);
  const sec = await svgToPng(secSvg);

  document.body.removeChild(tempDiv);
  return { quad, sec };
}

function svgToPng(svgEl, scale) {
  scale = scale || 2;
  return new Promise((resolve, reject) => {
    const width = parseInt(svgEl.getAttribute("width"), 10);
    const height = parseInt(svgEl.getAttribute("height"), 10);
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png").split(",")[1];
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
    };
    img.onerror = reject;
    img.src = svgDataUrl;
  });
}

/* -------------------------------------------------------------------- */
/* Punto de entrada: generar y descargar                                */
/* -------------------------------------------------------------------- */

async function generateAndDownloadExcel() {
  const wb = await buildWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const c = state.child;
  const name = [c.nombre, c.apellido].filter(Boolean).join("_") || "nino";
  a.href = url;
  a.download = `Perfil_Sensorial_${name}_diligenciado.xlsx`.replace(/\s+/g, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
