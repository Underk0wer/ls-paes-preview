# Limón Soda Zero — Sitio web (paquete de despliegue)

Sitio **100 % estático** de 3 pantallas. No necesita base de datos ni backend:
solo subir estos archivos a cualquier servidor/hosting que sirva archivos.

## Flujo

`index.html` → `formulario.html` → `gracias.html`

- **index.html** — Portada: composición por capas (`Assets/01`) con parallax, pulso de
  la lata, humo y botón *Participa aquí*.
- **formulario.html** — Pantalla de datos sobre el fondo con el diablo (`Assets/02`);
  el botón *ENVIAR* lleva a `gracias.html`.
- **gracias.html** — Confirmación sobre el fondo con el estudiante (`Assets/03`) +
  botones para compartir (Facebook / WhatsApp).

## Contenido

```
DESARROLLO/
├── index.html          ← página de inicio (el servidor la carga por defecto)
├── formulario.html
├── gracias.html
├── humo.js             ← humo animado del fondo (lo usan index y formulario)
├── transicion-fuego.js ← transición con el video de fuego (formulario → gracias)
├── .htaccess           ← config para Apache/cPanel (opcional; se ignora en otros hosts)
└── Assets/             ← videos, imágenes, SVG y logo (rutas relativas)
```

Todas las rutas son **relativas** (`Assets/...`), así que el sitio funciona tanto
en la raíz del dominio como dentro de una subcarpeta, sin cambios.

## Cómo subirlo

Elige la opción según tu hosting:

- **Hosting tradicional (cPanel / FTP / Apache):**
  sube **el contenido** de esta carpeta a `public_html/` (o a la subcarpeta que
  quieras). Asegúrate de subir también `.htaccess` y la carpeta `Assets/`.

- **Netlify / Vercel:** arrastra esta carpeta `DESARROLLO` a la interfaz, o
  apúntala como carpeta de publicación. (`.htaccess` se ignora, no molesta.)

- **GitHub Pages:** sube estos archivos a la rama del sitio; `index.html` en la raíz.

## Probar en local antes de subir

Ábrelo con un servidor local (no con doble clic sobre el archivo, porque los
videos y los enlaces para compartir necesitan `http://`):

```bash
cd DESARROLLO
python3 -m http.server 8000
# luego abre  http://localhost:8000
```

## Notas

- Los enlaces de **compartir** (Facebook / WhatsApp) usan la URL real del sitio,
  así que funcionan correctamente una vez publicado (no en `file://`).
- Los fondos están armados por capas en un lienzo de 1920×1080 y cubren la
  pantalla en cualquier formato; en mobile se reencuadran sobre los personajes.
- Los enlaces de **Bases legales** y **Términos y condiciones** hoy son imágenes
  sin enlace: si necesitas que abran un documento, hay que enlazarlos.
