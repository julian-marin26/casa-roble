# Casa Roble — demo de restaurante

Sitio estático completo, sin build, sin npm, sin dependencias en tiempo de ejecución.
Se sube arrastrando la carpeta a Hostinger, Netlify o GitHub Pages y funciona.

**Todo el contenido es ficticio.** Nombre, platos, precios, reseñas y dirección
son de ejemplo, pensados para que puedas enseñar el sitio a un prospecto y decir
"así se vería el tuyo".

---

## 1. Qué incluye

```
casa-roble/
├── index.html          Home: hero, manifiesto, platos, QR, reseñas, horarios, reserva
├── carta.html          Carta completa con filtros por categoría
├── styles.css          Todos los estilos (un solo archivo, por secciones)
├── main.js             Efectos, filtros y formulario
├── .htaccess           Cabeceras de caché para Hostinger (no lo borres)
├── lib/
│   ├── gsap.min.js     Animación (local, no CDN)
│   ├── ScrollTrigger.min.js
│   └── manifest.js     ← DATOS DE LA MARCA. Empieza por aquí.
├── assets/
│   ├── img/            Texturas placeholder + QR
│   └── favicon.svg
└── tools/              Script dev para regenerar placeholders. Se puede borrar.
```

Peso total: unos 790 KB, de los cuales 576 KB son imágenes que vas a reemplazar.

---

## 2. Cómo convertirlo en el sitio de un cliente

Son cuatro pasos, ninguno requiere tocar la estructura.

**Paso 1 — Los datos.** Abre `lib/manifest.js` y cambia nombre, teléfono,
dirección, horarios y redes. Es el único archivo pensado para editarse en cada venta.

**Paso 2 — Los colores.** En `styles.css`, arriba del todo, bloque `:root`.
Cambiando estas seis variables cambia el sitio entero:

```css
--bg:        #f4efe6;   /* fondo crema */
--bg-2:      #e8dfd0;   /* franjas y cajas */
--ink:       #1a1a1a;   /* texto */
--ink-mute:  #7a736a;   /* texto secundario */
--accent:    #b85c3a;   /* terracota: botones, énfasis, halo */
--accent-2:  #4a5d3a;   /* musgo: etiquetas veganas */
```

Para un comercio en vez de un restaurante, cambia `--accent` a algo más frío y
sustituye "carta" por "catálogo" en los textos. La estructura sirve igual.

**Paso 3 — Las fotos.** Pon las del cliente en `assets/photos/source/` y
conviértelas a WebP, o reemplaza directamente los archivos de `assets/img/`
manteniendo los mismos nombres. Los tamaños que espera el diseño:

| Archivo | Proporción | Uso |
|---|---|---|
| `mano-masa.webp` | 4:5 vertical | Imagen del hero |
| `sala-tarde.webp` | 3:2 horizontal | Sección manifiesto |
| `plato-1` … `plato-6` | 4:5 vertical | Tarjetas de platos |
| `og-portada.webp` | 1200×630 | Vista previa al compartir en WhatsApp |
| `qr-carta.webp` | cuadrado | Código QR de la carta |

El QR actual apunta a una URL de ejemplo. Regenéralo con el dominio real:
edita la última línea de `tools/generar_placeholders.py` y ejecútalo, o usa
cualquier generador online.

**Paso 4 — Los textos.** Están escritos directamente en el HTML, no en JavaScript.
Búscalos y cámbialos con cualquier editor.

---

## 3. Subirlo a Hostinger

1. Panel de Hostinger → Administrador de archivos → carpeta `public_html`.
2. Sube **el contenido** de esta carpeta, no la carpeta en sí.
3. Verifica que `.htaccess` llegó (los gestores de archivos a veces esconden
   los archivos que empiezan por punto: activa "mostrar archivos ocultos").

**Si cambias CSS o JS después del primer despliegue**, sube la versión nueva
y además cambia `?v=20260903` por la fecha de hoy en los dos HTML. Sin eso el
navegador seguirá usando la versión vieja durante días y vas a perseguir bugs
que ya arreglaste.

Para probarlo en local no basta con hacer doble clic: abre una terminal en la
carpeta y ejecuta `python3 -m http.server 8000`, luego entra a
`http://localhost:8000`.

---

## 4. Puente a la fase 2

El sitio está construido para que el salto al panel de administración sea
mecánico, no una reescritura.

**Lo que ya está preparado:**

- `lib/manifest.js` es un objeto con la forma exacta de un registro de la tabla
  `negocios`. Cuando exista base de datos, ese archivo se sustituye por una
  consulta y nada más cambia.
- Los platos de `carta.html` llevan `data-cat` y `data-tags` en el HTML. Esos
  atributos son las columnas `categoria` y `etiquetas` de la tabla `platos`.
- El filtro de la carta lee del DOM, así que no hay una segunda copia de los
  datos que se pueda desincronizar.
- La función `initFormulario()` en `main.js` simula el envío con un `setTimeout`.
  En la fase 2 ese `setTimeout` se cambia por un `fetch()` al backend. El resto
  de la función (validación, estados, mensajes) ya sirve.

**Esquema de base de datos propuesto** para cuando montemos Django. Fíjate en
que `negocio` aparece en todas las tablas desde el primer día, aunque solo
tengas un cliente: eso es lo que permite pasar a multi-inquilino después sin
migraciones dolorosas.

```
negocios
  id, nombre, slug, telefono, whatsapp, email, direccion, ciudad,
  color_acento, logo, plan, activo, creado

horarios
  id, negocio_id, dia_semana (0-6), abre, cierra, cerrado

categorias
  id, negocio_id, nombre, orden

platos
  id, negocio_id, categoria_id, nombre, descripcion, precio,
  precio_variable (bool), disponible (bool), foto, orden, etiquetas

reservas
  id, negocio_id, nombre, telefono, fecha, personas, nota,
  estado (pendiente/confirmada/cancelada), creado
```

Con esas cinco tablas y el admin de Django, el dueño ya puede cambiar precios y
marcar platos agotados sin llamarte. Ese es el momento en que empiezas a cobrar
mensual.

---

## 5. Detalles técnicos que conviene no romper

- **Nada de `<script type="module">`.** Todo usa `<script defer>` con funciones
  autoejecutadas. Así el sitio también funciona abriendo el archivo directamente.
- **El contenido está en el HTML, no en el JavaScript.** Si el JS falla, se
  pierden las animaciones pero se lee todo. Mantenlo así.
- **Las micro-interacciones no se apagan con `prefers-reduced-motion`.** Windows
  trae esa preferencia activada de fábrica en muchos equipos, y apagarlo todo
  hace que el cliente abra el sitio en su PC y lo vea plano. Solo se desactiva
  el parpadeo del splash.
- **El cursor personalizado solo aparece con ratón.** En táctil se desactiva solo.
