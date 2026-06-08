# El Palacio del Tiempo

> Mini-juego de plataformas y combate a espada hecho como **regalo para el Día del Padre**.
> Inspirado visualmente en el clásico *Prince of Persia* (1989): mazmorra de piedra, antorchas animadas, personajes con espada y un mensaje final dedicado.

Construido íntegramente con **HTML5 Canvas, CSS y JavaScript puro** — sin frameworks ni librerías de juego. Todo el escenario, los personajes y las animaciones se dibujan en tiempo real con la API 2D del canvas.

---

## Vista previa

| Desktop | Móvil |
|---|---|
| Canvas escalado al viewport, nitidez HiDPI | Botones táctiles bajo el canvas, sin tapar el juego |

> El juego se despliega automáticamente en [dia-del-padre-pi.vercel.app](https://dia-del-padre-pi.vercel.app) con cada push al repositorio.

---

## Características

- **Escenario al estilo clásico**: muros de piedra gris-azulada con relieve biselado, puntitos decorativos, nichos oscuros, antorchas con llama animada, suelo de losas y arco de salida.
- **Personajes vectoriales** con contorno, túnica/casco, pelo rubio o penacho rojo, y espada con guarda dorada.
- **Animaciones** de caminar, saltar, agacharse, atacar, recibir golpe y caer muerto.
- **Sistema de combate**: cuando ambas espadas chocan a la vez se produce un *parry* (chispas + retroceso, sin daño), en vez de fallar.
- **Pozo con pinchos** que hay que saltar; si caes, vuelves justo antes (sin morir).
- Pantalla de título, partida y **pantalla final** con el mensaje del Día del Padre animado.
- **Controles WASD + Shift** para teclado y **botones táctiles** para celular/tablet.
- Iconos con **Font Awesome 6** y tipografías medievales de **Google Fonts**.
- **Canvas HiDPI/Retina**: el buffer se ajusta a `tamaño CSS × devicePixelRatio` cada vez que cambia el tamaño de ventana, sin pérdida de nitidez.
- **Favicon completo**: SVG, PNG, ICO, apple-touch-icon y manifiesto para Android/PWA.
- Layout **responsivo** con `min(dvw, dvh-constrained, 1400px)` para desktop grande, tablet y móvil portrait.

---

## Cómo se juega

El objetivo es avanzar por el corredor de la mazmorra, **saltar el pozo** y **derrotar al guardia** en combate a espada. Al vencerlo aparece el mensaje del Día del Padre.

El juego es intencionalmente fácil de terminar: si caes al pozo vuelves automáticamente, y si pierdes todas las vidas la partida reinicia sola.

### Controles

| Acción | Teclado | Celular |
|---|---|---|
| Mover izquierda | `A` / `←` | Botón `‹` |
| Mover derecha | `D` / `→` | Botón `›` |
| Saltar | `W` / `↑` | Botón `⌃⌃` (arriba) |
| Agacharse | `S` / `↓` | Botón `⌄⌄` (abajo) |
| Golpear / Atacar | `Shift` / `Espacio` | Botón de la espada `⚔` |
| Empezar / Reiniciar | `Enter` / cualquier tecla | Tocar la pantalla |

> En combate cuerpo a cuerpo, si atacas exactamente cuando el guardia ataca se produce un **choque de espadas** (parry): chispas, retroceso mutuo, sin daño para ninguno.

---

## Cómo ejecutarlo

### Opción 1 — abrir directamente

Descarga la carpeta completa y abre `index.html` con doble clic en el navegador.

> Nota: algunos navegadores bloquean recursos locales con `file://`. Si ves la pantalla en negro o sin fuentes, usa la opción 2.

### Opción 2 — servidor local (recomendado)

```bash
# Con Python (viene instalado en macOS / Linux)
cd dia-del-padre
python -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.

```bash
# Con Node.js (si tienes npx)
npx serve .
```

### Opción 3 — despliegue en Vercel / Netlify

Sube la carpeta como proyecto estático. No necesita build ni configuración: Vercel sirve `index.html` como raíz automáticamente.

---

## Estructura del proyecto

```
dia-del-padre/
│
├── index.html                      # Estructura HTML: canvas, botones táctiles y barra de ayuda
├── estilos.css                     # Estilos: layout responsivo, stage, botones táctiles
├── juego.js                        # Lógica completa: fondo, personajes, física, combate y mensaje
├── README.md                       # Este archivo
│
├── favicon.svg                     # Icono vectorial (navegadores modernos, cualquier tamaño)
├── favicon-96x96.png               # Icono PNG de respaldo
├── favicon.ico                     # Icono clásico multi-resolución (navegadores antiguos)
├── apple-touch-icon.png            # Icono al añadir a pantalla de inicio en iOS
├── site.webmanifest                # Manifiesto para Android / instalación como PWA
├── web-app-manifest-192x192.png    # Icono del manifiesto (192 px)
└── web-app-manifest-512x512.png    # Icono del manifiesto (512 px)
```

> Todos los archivos deben estar en la **misma carpeta**. Las rutas son relativas y funcionan tanto abriendo localmente como desplegado en una subcarpeta o raíz de dominio.

---

## Personalizar el mensaje

Edita la constante `FATHERS_DAY` al inicio de `juego.js`:

```javascript
const FATHERS_DAY = {
  titulo: "¡Feliz Día del Padre!",
  lineas: [
    "Podrán pasar los años y cambiar los escenarios,",
    "pero hay algo que el tiempo jamás podrá borrar:",
    "",
    "El valor de tus consejos, la fuerza de tu apoyo",
    "y el gran orgullo que siento al decir",
    "que sigo los pasos del mejor hombre del mundo.",
    "",
    "Te quiero con todo el corazón, papá. ❤",
  ],
  firma: "— De quien siempre te lleva como guía",
};
```

Cada elemento del array `lineas` es un renglón. Una cadena vacía `""` inserta un espacio en blanco entre párrafos.

### Otros ajustes rápidos en `juego.js`

| Qué cambiar | Dónde | Valor por defecto |
|---|---|---|
| Vidas del jugador | `makeFighter(x, true)` → campo `hp` | `4` |
| Vidas del guardia | `makeFighter(x, false)` → campo `hp` | `4` |
| Velocidad de ataque del guardia | `updateGuardAI()` → `aiT` (segundos entre ataques) | `1.1 – 1.9` aleatorio |
| Posición del pozo | `const PIT = { x: 430, w: 96 }` | x=430, ancho=96 px |
| Posición del guardia | `makeFighter(ARENA_X + 120, false)` | `ARENA_X = 760` |

---

## Decisiones técnicas

### Canvas HiDPI / Retina

El canvas HTML tiene una resolución interna fija de **960 × 470 px** (coordenadas del juego). Para que se vea nítido en cualquier tamaño de pantalla o monitor Retina, al cargar la página y en cada `resize` se ejecuta:

```javascript
function resizeCanvas() {
  const r   = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(r.width  * dpr);
  canvas.height = Math.round(r.height * dpr);
}
```

Y en cada frame de `render()` se aplica una escala antes de dibujar:

```javascript
ctx.scale(canvas.width / W, canvas.height / H);
```

Así todo el código de dibujo sigue usando coordenadas 0–960 sin cambios, pero el resultado en pantalla es siempre nítido.

### Layout responsivo

El ancho del `.frame` se calcula con `min()` sobre tres restricciones:

```css
width: min(
  calc(100dvw - 32px),            /* limitado por ancho del viewport */
  calc((100dvh - 130px) * 2.04),  /* limitado por alto (ratio 960/470 ≈ 2.04) */
  1400px                          /* tope máximo en monitores muy grandes */
);
```

Esto hace que el juego llene la pantalla de forma natural tanto en desktop grande como en tablets, sin desbordar verticalmente.

### Botones táctiles adaptativos

Los botones táctiles viven **fuera del `<canvas>`** en un elemento `#touch` hermano. En desktop y landscape son un overlay absoluto encima del canvas (semitransparentes). En portrait mobile (`≤ 640 px`) se convierten en una **barra de controles debajo del canvas** mediante una media query, sin tapar el juego.

---

## Tecnologías

- **HTML5 Canvas API** — dibujo y animación de fondo, personajes y efectos.
- **CSS** — layout responsivo con `dvh`, `dvw`, `min()` y `aspect-ratio`; botones táctiles adaptativos.
- **JavaScript puro (ES2020+)** — física, IA del guardia, sistema de combate, entrada unificada teclado/táctil.
- [**Font Awesome 6.5.1**](https://fontawesome.com/) (CDN) — iconos `fa-chevron-*`, `fa-angles-*` y `fa-khanda`.
- [**Google Fonts**](https://fonts.google.com/) (CDN) — *Cinzel Decorative*, *Cinzel* y *MedievalSharp*.
- **Favicon** generado con [RealFaviconGenerator](https://realfavicongenerator.net/): SVG + PNG + ICO + apple-touch-icon + webmanifest.

> Font Awesome y Google Fonts se cargan por CDN y requieren conexión a internet. El juego funciona sin ellos (con fuentes de respaldo y sin iconos), pero se ve mejor con conexión.

---

## Créditos

Inspirado visualmente en *Prince of Persia* (1989) de **Jordan Mechner** — solo como homenaje. Todo el código, los gráficos vectoriales y el diseño de este proyecto son originales.

Hecho con cariño para el **Día del Padre** 🗡️
