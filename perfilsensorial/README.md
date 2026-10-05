# Perfiles sensoriales (`/perfilsensorial/`)

Cuestionarios del Perfil Sensorial 2 con sesiones por paciente. HTML/CSS/JS sin build;
los datos se guardan en **Supabase** (base de datos + inicio de sesión).

## Cómo funciona

1. La profesional entra a `/perfilsensorial/profesional/` (correo y contraseña) y crea una **sesión**
   para cada paciente: se genera un enlace único (`/perfilsensorial/bebe/?s=TOKEN` o `/escolar/?s=TOKEN`).
2. El cuidador abre el enlace, acepta la autorización de datos, responde y **envía**. Nunca ve resultados.
3. La profesional ve en su panel la sesión como "Enviada" y abre `sesion/?id=…` para consultar
   los resultados, las gráficas, la guía, escribir notas clínicas y descargar el Excel.

## Estructura

```
perfilsensorial/
├── index.html              Entrada: cuidador (por enlace) o profesional
├── styles.css              Estilos (marca Sentio)
├── vendor/                 exceljs (Excel) y supabase-js, versiones fijas
├── shared/
│   ├── config.js           URL y clave pública de Supabase + texto de autorización (editar aquí)
│   ├── api.js              Todo el acceso a Supabase
│   ├── common-data.js      Escala de respuesta y definiciones de cuadrantes
│   ├── app.js              Motor del cuestionario: modo cuidador y modo profesional
│   └── xlsx-export.js      Generación del Excel diligenciado
├── bebe/                   Bebé / Niño pequeño (7 a 35 meses, 54 ítems): index.html + data.js
├── escolar/                Escolares (3 a 14 años, 86 ítems): index.html + data.js
└── profesional/
    ├── index.html, panel.js   Ingreso, creación de enlaces y lista de sesiones
    └── sesion/index.html      Vista de resultados de una sesión enviada
```

## Seguridad

- La seguridad la dan las **reglas de la base de datos** (RLS + funciones), no el código del navegador.
  `supabaseUrl` y `supabaseAnonKey` en `shared/config.js` son públicas por diseño. **Nunca** publicar
  la clave `service_role` ni la contraseña de la base de datos.
- El enlace del cuidador solo permite consultar si la sesión sigue abierta y enviar las respuestas **una vez**
  (validadas en el servidor). No puede leer nada de la tabla.
- Los resultados no se guardan: se calculan al abrir la sesión a partir de las respuestas, con las mismas
  tablas normativas del protocolo.

## Agregar otro perfil

1. Copiar `escolar/` a una carpeta nueva y ajustar `data.js` (`PROFILE`, `ITEMS`, `SECTIONS`, `QUADRANTS`,
   `RANGES`, `RECOMMENDATIONS`, `CHILD_FIELDS`) y los textos de `index.html`.
2. Agregar el perfil a la restricción `check` y al número de ítems esperado en `enviar_respuestas`
   (archivo `supabase/schema.sql`) y a `PERFILES` en `profesional/panel.js`.
