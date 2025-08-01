const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const sortearBtn = document.getElementById("sortear");
const textarea = document.getElementById("nombres");
const resultado = document.getElementById("resultado");
const ganadorOverlay = document.getElementById("ganador-overlay");
const nombreGanador = document.getElementById("nombre-ganador");
const cerrarOverlay = document.getElementById("cerrar-overlay");
const musica = document.getElementById("musica");

const COLORES_RULETA = [
  "#FF6B6B", "#48DBFB", "#FFD166", "#06D6A0",
  "#A051F9", "#FF9A76", "#7EE081", "#FF85B3",
  "#9394FF", "#FFC154", "#6BD5E1", "#FF9E7D"
];

let nombres = [];
let girando = false;
let rotacionActual = 0;
let ganadorIndex = -1;

function init() {
  textarea.addEventListener("input", actualizarNombres);
  sortearBtn.addEventListener("click", girarRuleta);
  cerrarOverlay.addEventListener("click", cerrarOverlayGanador);
  actualizarNombres();
}

function actualizarNombres() {
  const texto = textarea.value.trim();
  nombres = texto.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== "");
  
  if (nombres.length === 0) {
    resultado.textContent = "Agrega nombres para comenzar";
  } else {
    resultado.textContent = `${nombres.length} nombres en la ruleta`;
  }
  
  dibujarRuleta();
}

function dibujarRuleta() {
  const tamano = canvas.width;
  const centro = tamano / 2;
  const radio = centro - 20;
  
  ctx.clearRect(0, 0, tamano, tamano);
  
  if (nombres.length === 0) {
    ctx.beginPath();
    ctx.arc(centro, centro, radio, 0, Math.PI * 2);
    ctx.fillStyle = "#f8f9fa";
    ctx.strokeStyle = "#4a9e88";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "#4a9e88";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Agrega nombres", centro, centro);
    return;
  }
  
  const anguloPorSegmento = (Math.PI * 2) / nombres.length;
  
  nombres.forEach((nombre, index) => {
    const anguloInicio = index * anguloPorSegmento;
    const anguloFin = anguloInicio + anguloPorSegmento;
    const color = COLORES_RULETA[index % COLORES_RULETA.length];
    
    ctx.beginPath();
    ctx.moveTo(centro, centro);
    ctx.arc(centro, centro, radio, anguloInicio, anguloFin);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    
    ctx.save();
    ctx.translate(centro, centro);
    ctx.rotate(anguloInicio + anguloPorSegmento / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const texto = nombre.length > 12 ? nombre.substring(0, 10) + "..." : nombre;
    ctx.fillText(texto, radio * 0.65, 0);
    ctx.restore();
  });
  
  ctx.beginPath();
  ctx.arc(centro, centro, radio, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function girarRuleta() {
  if (girando || nombres.length < 2) {
    if (nombres.length < 2) {
      alert("¡Necesitas al menos 2 nombres para girar la ruleta!");
    }
    return;
  }
  
  girando = true;
  musica.currentTime = 0;
  musica.play();

  ganadorIndex = Math.floor(Math.random() * nombres.length);
  
  const segmentos = nombres.length;
  const anguloPorSegmento = 360 / segmentos;
  const anguloObjetivo = 270 - (ganadorIndex * anguloPorSegmento);
  
  const vueltas = 5;
  const totalGrados = (vueltas * 360) + anguloObjetivo;

  const inicio = performance.now();
  const duracion = 4000;
  
  function animar(tiempo) {
    const tiempoTranscurrido = tiempo - inicio;
    const progreso = Math.min(tiempoTranscurrido / duracion, 1);
    const easing = Math.pow(progreso - 1, 3) + 1;
    
    rotacionActual = easing * totalGrados;
    canvas.style.transform = `rotate(${rotacionActual}deg)`;
    
    if (progreso < 1) {
      requestAnimationFrame(animar);
    } else {
      setTimeout(() => {
        mostrarGanador();
        girando = false;
      }, 500);
    }
  }
  
  requestAnimationFrame(animar);
}

function mostrarGanador() {
  nombreGanador.textContent = nombres[ganadorIndex];
  ganadorOverlay.classList.add("mostrar");
  musica.play();
}

function cerrarOverlayGanador() {
  ganadorOverlay.classList.remove("mostrar");
  musica.pause();
  canvas.style.transform = `rotate(${rotacionActual % 360}deg)`;
}

document.addEventListener("DOMContentLoaded", init);