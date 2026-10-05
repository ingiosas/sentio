# Perfiles sensoriales (`/perfilsensorial/`)

Cuestionarios interactivos del Perfil Sensorial 2 (HTML/CSS/JS, sin build ni servidor;
las respuestas se guardan solo en el navegador de quien las diligencia).

```
perfilsensorial/
├── index.html            Menú para elegir el perfil
├── styles.css            Estilos (marca Sentio), compartidos por todo
├── vendor/exceljs.min.js Librería para generar el Excel diligenciado
├── shared/
│   ├── common-data.js    Escala de respuesta, niveles y definiciones de cuadrantes
│   ├── app.js            Motor del cuestionario (pantallas, cálculo, gráficas)
│   └── xlsx-export.js    Generación del Excel diligenciado
├── bebe/                 Bebé / Niño pequeño — 7 a 35 meses (54 ítems)
│   ├── index.html
│   └── data.js           PROFILE, ítems, secciones, cuadrantes y rangos normativos
└── escolar/              Escolares — 3 a 14 años (86 ítems)
    ├── index.html
    └── data.js
```

## Agregar otro perfil

1. Copiar `escolar/` a una carpeta nueva y ajustar `data.js` (`PROFILE`, `ITEMS`, `SECTIONS`,
   `QUADRANTS`, `RANGES`, `RECOMMENDATIONS`, `CHILD_FIELDS`) y los textos de `index.html`.
2. Usar una `storageKey` propia en `PROFILE` para no mezclar el progreso con otros perfiles.
3. Agregar la tarjeta en `index.html` (menú) y su clave en el script de progreso.

Nota: el perfil de bebé conserva la clave `perfilSensorial2_v1` que usaba antes del menú,
para no perder el progreso de quienes ya lo tenían en curso.
