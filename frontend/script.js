// script.js

const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const sortearBtn = document.getElementById("sortear");
const resultadoTexto = document.getElementById("resultado");
const musica = document.getElementById("musica");

const opcionesDiv = document.getElementById("opcionesGanador");
const dejarGanadorBtn = document.getElementById("dejarGanador");
const eliminarGanadorBtn = document.getElementById("eliminarGanador");

const ganadorFinalOverlay = document.getElementById("ganador-final-overlay");
const nombreGanadorOverlay = document.getElementById("nombre-ganador-overlay");
const volverSortearBtnOverlay = document.getElementById("volver-sortear-overlay");

let nombres = [];
let ganadorIndex = -1;
let girando = false;
let rotacionActual = 0; // Rotación actual en grados

// Inicialización: Dibuja la ruleta al cargar la página con nombres de ejemplo.
window.onload = () => {
  const nombresEjemplo = ["Ana", "Pedro", "Lucía", "Carlos", "María", "Sofía", "Diego"];
  // No rellenamos el textarea aquí para usar el placeholder, pero usamos los nombres para dibujar la ruleta
  nombres = nombresEjemplo; // Inicializa la lista de nombres para dibujar la ruleta
  dibujarRuleta(nombres); // Dibuja la ruleta con los nombres de ejemplo
  musica.load();
};

function dibujarRuleta(nombresADibujar) {
  const total = nombresADibujar.length;
  if (total === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(200, 200, 180, 0, 2 * Math.PI);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
      ctx.stroke();
      return;
  }

  const anguloPorSegmento = (2 * Math.PI) / total; // Ángulo de cada segmento en radianes

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < total; i++) {
    const start = i * anguloPorSegmento;
    const end = start + anguloPorSegmento;

    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, 180, start, end);
    ctx.fillStyle = `hsl(${i * (360 / total)}, 70%, 60%)`;
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(200, 200); // Mueve el origen al centro de la ruleta

    // *** CAMBIOS CLAVE AQUÍ para la orientación del texto ***
    // 1. Rotar al centro del segmento.
    ctx.rotate(start + anguloPorSegmento / 2);
    
    // 2. Rotar el texto adicionalmente para que esté horizontal.
    // Si la ruleta gira en sentido horario, y el texto se dibuja originalmente a la derecha (0 grados),
    // y luego rotamos el segmento para posicionarlo, el texto también rota.
    // Para que el texto sea horizontal cuando el segmento esté en la parte superior (o en cualquier lugar),
    // necesitamos contrarrestar la rotación del segmento más un offset.
    // Si el texto se dibuja a la derecha (radio 170), y queremos que sea horizontal cuando esté "arriba",
    // significa que la línea base del texto debe ser horizontal.
    // La rotación ya aplicada es `start + anguloPorSegmento / 2`.
    // Para que el texto sea horizontal, debemos contrarrotar este mismo ángulo.
    // Sin embargo, queremos que el texto esté "hacia afuera" y sea legible.
    // Consideremos que el 0 grados es a la derecha, y el texto se dibuja "hacia la derecha".
    // Si rotamos el canvas, el "derecha" también rota.
    // Para que el texto esté horizontal cuando el segmento está "arriba", necesitamos rotarlo -90 grados (sentido antihorario)
    // respecto a la dirección radial del segmento.
    ctx.rotate(Math.PI / 2); // Rota 90 grados adicionales (sentido horario) para que el texto esté vertical si se dibuja en (X,0)
                              // Si quieres que quede horizontal cuando el segmento está arriba, esto puede variar.
                              // Vamos a probar con -Math.PI / 2 para que esté horizontal cuando el segmento está arriba.
    ctx.rotate(-Math.PI / 2); // Rota 90 grados en sentido antihorario, para que el texto sea horizontal
                              // cuando el segmento está apuntando radialmente.

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial";
    // El texto se dibuja en el eje X después de la rotación para el segmento y el texto horizontal.
    // 'X' es la distancia desde el centro. 'Y' es 0 para que esté centrado en su "línea".
    ctx.fillText(nombresADibujar[i], 120, 0); // 120 es la distancia radial desde el centro
    ctx.restore();
  }
}

sortearBtn.addEventListener("click", () => {
  if (girando) return;

  ocultarGanadorFinal();
  opcionesDiv.classList.remove("mostrar");
  resultadoTexto.innerText = "";

  const texto = document.getElementById("nombres").value.trim();
  if (!texto) {
    alert("Por favor, escribe al menos un nombre.");
    return;
  }

  nombres = procesarNombres(texto);

  if (nombres.length < 2) {
    alert("Agrega al menos 2 nombres para que la ruleta tenga sentido.");
    return;
  }

  musica.play();
  girando = true;

  dibujarRuleta(nombres);

  ganadorIndex = Math.floor(Math.random() * nombres.length);
  const anguloPorSegmentoGrados = 360 / nombres.length;

  // *** LÓGICA PARA QUE LA FLECHA APUNTE AL GANADOR EN LA PARTE SUPERIOR ***
  // La flecha está en la parte superior, que en el sistema de coordenadas de Canvas es 270 grados (o -90 grados).
  // Si el texto está horizontal, el centro del texto está a 0 grados después de las rotaciones de posicionamiento.
  // Así que queremos que el "segmento" (donde el texto reside) apunte a la flecha.
  // El ángulo de inicio del segmento ganador es (ganadorIndex * anguloPorSegmentoGrados).
  // Para que el centro de este segmento esté en 270 grados (arriba), el punto de giro debe ser:
  // (270 - (ángulo de inicio del ganador + mitad de su segmento)) + (giros completos)

  // Ángulo del centro del segmento ganador si no hubiera rotación inicial.
  let centroDelSegmentoGanadorActual = (ganadorIndex * anguloPorSegmentoGrados) + (anguloPorSegmentoGrados / 2);

  // La posición de la flecha es 270 grados.
  const TARGET_ANGLE_AT_FLECHA = 270;

  // Calculamos cuánto necesita rotar la ruleta para que el centro del segmento ganador
  // se mueva a la posición de la flecha (270 grados).
  // La diferencia entre el objetivo y la posición actual del centro del segmento.
  let deltaAngle = TARGET_ANGLE_AT_FLECHA - centroDelSegmentoGanadorActual;

  // Normalizar deltaAngle para que sea el giro más corto y positivo
  deltaAngle = (deltaAngle % 360 + 360) % 360;

  // Sumar giros completos para efecto dramático
  const numFullSpins = 5;
  // La rotación total objetivo es la rotación actual + giros completos + el ajuste para el ganador
  const totalTargetRotation = rotacionActual + (360 * numFullSpins) + deltaAngle;


  let inicio = performance.now();

  function animar(timestamp) {
    let progreso = timestamp - inicio;
    let duracion = 4000;
    let t = Math.min(progreso / duracion, 1);

    let rotacion = easeOutCubic(t) * totalTargetRotation;
    rotacionActual = rotacion;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(200, 200);
    ctx.rotate(rotacion * Math.PI / 180);
    ctx.translate(-200, -200);

    limpiarRuleta();
    dibujarRuleta(nombres);

    if (progreso < duracion) {
      requestAnimationFrame(animar);
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      girando = false;
      musica.pause();
      musica.currentTime = 0;

      mostrarGanadorFinal(nombres[ganadorIndex]);
      resultadoTexto.innerText = "";
      setTimeout(() => opcionesDiv.classList.add("mostrar"), 200);
    }
  }

  requestAnimationFrame(animar);
});

dejarGanadorBtn.addEventListener("click", () => {
  opcionesDiv.classList.remove("mostrar");
  ocultarGanadorFinal();
});

eliminarGanadorBtn.addEventListener("click", () => {
  if (nombres.length <= 1) {
    alert("Necesitas al menos un nombre en la lista. No se puede eliminar al último.");
    return;
  }
  
  nombres.splice(ganadorIndex, 1); 
  
  document.getElementById("nombres").value = nombres.join("\n");
  
  opcionesDiv.classList.remove("mostrar");
  ocultarGanadorFinal();
  
  rotacionActual = 0; 
  dibujarRuleta(nombres); 
});

volverSortearBtnOverlay.addEventListener("click", () => {
    ocultarGanadorFinal();
    resultadoTexto.innerText = "";
    document.body.classList.remove('ocultar-contenido');
    rotacionActual = 0; 
    dibujarRuleta(nombres); 
});


function limpiarRuleta() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function procesarNombres(texto) {
  return texto.split(/[\n,;]+/)
               .map(n => n.trim())
               .filter(n => n !== '');
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function mostrarGanadorFinal(nombre) {
    nombreGanadorOverlay.textContent = nombre;
    ganadorFinalOverlay.classList.add("mostrar");
    document.body.classList.add('ocultar-contenido');
}

function ocultarGanadorFinal() {
    ganadorFinalOverlay.classList.remove("mostrar");
    document.body.classList.remove('ocultar-contenido');
}






  