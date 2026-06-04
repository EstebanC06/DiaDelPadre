# El Palacio del Tiempo

Mini-juego de plataformas y combate a espada, hecho como **regalo para el Día del Padre**. Está inspirado en el clásico *Prince of Persia* (1989): atraviesas una mazmorra de piedra, saltas un pozo con pinchos, te enfrentas a un guardia y, al vencerlo, aparece un mensaje dedicado.

Construido con **HTML5, CSS y JavaScript puro** (sin librerías ni frameworks). Todo el escenario y los personajes se dibujan en un `<canvas>`.

---

## Características

- Escenario tipo mazmorra dibujado a mano: muros de piedra con relieve, nichos oscuros, antorchas animadas y suelo de losas.
- Personajes vectoriales con contorno, túnica, pelo/casco y espada (héroe y guardia).
- Animaciones de caminar, saltar, agacharse y atacar.
- Combate sencillo e **indulgente**: si chocas tu espada con la del guardia se produce un *parry* (chispas, sin daño).
- Pantalla de inicio, partida y pantalla final con el mensaje personalizado.
- **Controles WASD + Shift** y **botones táctiles** para jugar en el celular.
- Iconos con **Font Awesome** y tipografías de **Google Fonts**.

---

## Cómo se juega

El objetivo es avanzar por el corredor, cruzar el pozo y derrotar al guardia. Cuando lo venzas, se muestra el mensaje del Día del Padre.

El juego es a propósito fácil de terminar: si caes al pozo, vuelves justo antes de él (no mueres), y si pierdes todas tus vidas, la partida se reinicia sola.

### Controles

| Acción | Teclado | Celular |
|---|---|---|
| Mover izquierda / derecha | `A` / `D` (o flechas) | Botones `‹` / `›` |
| Saltar | `W` (o flecha arriba) | Botón `⌄⌄` (arriba) |
| Agacharse | `S` (o flecha abajo) | Botón `⌄⌄` (abajo) |
| Golpear | `Shift` (o `Espacio`) | Botón de la espada |
| Empezar / Reiniciar | `Enter` / `R` | Tocar la pantalla |

---

## Cómo ejecutarlo

1. Mantén los tres archivos (`index.html`, `estilos.css`, `juego.js`) en la **misma carpeta**.
2. Abre `index.html` en tu navegador (doble clic).

Si tu navegador bloquea archivos locales, levanta un servidor sencillo desde la carpeta del proyecto:

```bash
# Con Python instalado
python -m http.server 8000
```

Luego entra a `http://localhost:8000`.

---

## Estructura del proyecto

```
dia-del-padre/
├── index.html     # Estructura: canvas, botones táctiles y barra de ayuda
├── estilos.css    # Estilos: paleta, marco del escenario y controles táctiles
├── juego.js       # Lógica: fondo, personajes, controles, combate y mensaje
└── README.md      # Este archivo
```

---

## Personalizar el mensaje

El mensaje final se edita al inicio de `juego.js`, en la constante `FATHERS_DAY`:

```javascript
const FATHERS_DAY = {
  titulo: "¡Feliz Día del Padre!",
  lineas: [
    "Cruzaste cada trampa, venciste cada miedo...",
    "igual que lo haces por mí todos los días.",
    "",
    "Gracias por ser mi héroe, mi guía",
    "y mi ejemplo más grande.",
    "",
    "Te quiero, papá. ❤"
  ],
  firma: "— De parte de quien siempre te admira"
};
```

Cambia el `titulo`, las `lineas` (cada texto es un renglón; deja `""` para un espacio en blanco) y la `firma`.

### Otros ajustes rápidos

Dentro de `juego.js` puedes modificar:

- **Vidas:** en la función `makeFighter`, el campo `hp` (por defecto 4 para ambos).
- **Dificultad del guardia:** en `updateGuardAI`, el valor `aiT` controla cada cuánto ataca (mayor = más fácil).
- **Posición del pozo:** la constante `PIT = { x: 430, w: 96 }`.

---

## Tecnologías

- HTML5 `<canvas>` para el dibujo y la animación.
- CSS para el marco, los botones táctiles y la disposición responsiva.
- JavaScript puro (sin dependencias) para toda la lógica del juego.
- [Font Awesome 6.5.1](https://fontawesome.com/) para los iconos de los botones.
- [Google Fonts](https://fonts.google.com/): *Cinzel*, *Cinzel Decorative* y *MedievalSharp*.

> Nota: Font Awesome y Google Fonts se cargan por CDN, así que se necesita conexión a internet para que los iconos y las tipografías se vean como en el diseño. El juego funciona igual sin ellos (con fuentes de respaldo).

---

## Créditos

Inspirado en *Prince of Persia* (1989) de Jordan Mechner, solo como homenaje visual. Todo el código y los gráficos de este proyecto son originales.

Hecho con cariño para el **Día del Padre**.
