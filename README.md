# Sentio — sitio web

Sitio de una sola página (HTML/CSS/JS, sin frameworks ni build step).

## Reemplazar los elementos de marca

1. **Logo**: coloca el archivo en `assets/logo/` y reemplaza el bloque `<span class="logo-mark">`
   (SVG genérico) en [index.html](index.html) por `<img src="assets/logo/tu-logo.svg" alt="Sentio">`.
2. **Colores**: edita las variables en la parte superior de [css/style.css](css/style.css)
   (`--color-primary`, `--color-accent`, etc.). Todo el sitio usa esas variables.
3. **Fotografías**: coloca las imágenes en `assets/images/` y reemplaza cada
   `<div class="photo-placeholder">...</div>` en `index.html` por la etiqueta `<img>`
   correspondiente (las instrucciones exactas están comentadas justo encima de cada placeholder).
4. **Datos de contacto**: en la sección `#contacto` de `index.html`, reemplaza los textos
   `[PLACEHOLDER: ...]` (teléfono, correo, dirección, redes sociales).
5. **Formulario de contacto**: actualmente solo muestra un mensaje de confirmación (no envía
   correos reales). Para recibirlos de verdad, conectar con un servicio como Formspree, EmailJS,
   o un backend propio — ver comentario en `js/script.js`.

## Ver el sitio localmente

```bash
cd /Users/Juan/Desktop/SENTIO
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.
