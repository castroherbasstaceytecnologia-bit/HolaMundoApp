const homeScreen = document.getElementById("homeScreen");
const experienceScreen = document.getElementById("experienceScreen");
const helloBtn = document.getElementById("helloBtn");
const byeBtn = document.getElementById("byeBtn");
const backBtn = document.getElementById("backBtn");
const replayBtn = document.getElementById("replayBtn");

const experienceArt = document.getElementById("experienceArt");
const experienceSymbol = document.getElementById("experienceSymbol");
const experienceEyebrow = document.getElementById("experienceEyebrow");
const experienceTitle = document.getElementById("experienceTitle");
const experienceMessage = document.getElementById("experienceMessage");
const soundLabel = document.getElementById("soundLabel");
const soundIcon = document.getElementById("soundIcon");
const particles = document.getElementById("particles");

let audioContext = null;
let melodyTimer = null;
let activeOscillators = new Set();
let currentExperience = null;
let melodyIndex = 0;
let melodyGeneration = 0;

const experiences = {
  hello: {
    color: "#57eaff",
    symbol: "✦",
    eyebrow: "UNA NUEVA AVENTURA COMIENZA",
    title: "¡HOLA,<br>MUNDO!",
    message: "Un pequeño saludo puede ser el comienzo de algo extraordinario. ¡El universo te da la bienvenida!",
    label: "MELODÍA DE BIENVENIDA",
    icon: "♫",
    notes: [
      [523.25, 0.22], [659.25, 0.22], [783.99, 0.3],
      [1046.5, 0.38], [783.99, 0.22], [880, 0.22],
      [1046.5, 0.42], [783.99, 0.22], [659.25, 0.3],
      [523.25, 0.4], [659.25, 0.22], [783.99, 0.5]
    ],
    wave: "sine",
    volume: 0.075
  },
  bye: {
    color: "#c5a0ff",
    symbol: "☾",
    eyebrow: "CADA FINAL GUARDA UN RECUERDO",
    title: "¡CHAO,<br>MUNDO!",
    message: "Todo viaje tiene una pausa. Gracias por formar parte de este pequeño universo. ¡Hasta la próxima!",
    label: "MELODÍA DE DESPEDIDA",
    icon: "♫",
    notes: [
      [659.25, 0.4], [587.33, 0.4], [523.25, 0.55],
      [440, 0.5], [523.25, 0.4], [493.88, 0.4],
      [440, 0.6], [392, 0.45], [349.23, 0.7],
      [392, 0.45], [440, 0.9]
    ],
    wave: "triangle",
    volume: 0.055
  }
};

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Este navegador no admite audio web.");
    }

    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function stopMelody() {
  melodyGeneration++;

  if (melodyTimer !== null) {
    clearTimeout(melodyTimer);
    melodyTimer = null;
  }

  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch (_) {
      // El sonido puede haber terminado ya.
    }
  });

  activeOscillators.clear();
}

function playNote(frequency, duration, config, generation) {
  if (
    !audioContext ||
    audioContext.state !== "running" ||
    generation !== melodyGeneration
  ) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = config.wave;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    config.volume,
    now + 0.035
  );
  gain.gain.setValueAtTime(
    config.volume,
    now + Math.max(0.04, duration * 0.55)
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  activeOscillators.add(oscillator);

  oscillator.onended = () => {
    activeOscillators.delete(oscillator);
    oscillator.disconnect();
    gain.disconnect();
  };

  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

async function startMelody(type) {
  stopMelody();

  const generation = melodyGeneration;
  const config = experiences[type];

  soundLabel.textContent = "PREPARANDO MELODÍA...";
  document.querySelector(".sound-indicator").classList.remove("muted");

  try {
    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    if (generation !== melodyGeneration) return;

    melodyIndex = 0;
    soundLabel.textContent = config.label;

    function playNextNote() {
      if (
        generation !== melodyGeneration ||
        currentExperience !== type
      ) {
        return;
      }

      const [frequency, duration] =
        config.notes[melodyIndex];

      playNote(frequency, duration, config, generation);

      melodyIndex = (melodyIndex + 1) % config.notes.length;

      melodyTimer = setTimeout(
        playNextNote,
        (duration + 0.12) * 1000
      );
    }

    playNextNote();
  } catch (error) {
    soundLabel.textContent = "AUDIO NO DISPONIBLE";
    console.warn("No se pudo iniciar el audio:", error);
  }
}

function createParticles(type) {
  particles.replaceChildren();

  const color = type === "hello" ? "#57eaff" : "#c5a0ff";
  const symbols = type === "hello"
    ? ["✦", "✧", "·", "⋆", "✶"]
    : ["✧", "·", "☾", "⋆", "✦"];

  for (let i = 0; i < 28; i++) {
    const particle = document.createElement("span");

    particle.className = "particle";
    particle.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty(
      "--duration",
      `${5 + Math.random() * 7}s`
    );
    particle.style.animationDelay = `${Math.random() * 5}s`;
    particle.style.fontSize = `${10 + Math.random() * 15}px`;
    particle.style.color = color;

    particles.appendChild(particle);
  }
}

function openExperience(type) {
  currentExperience = type;
  const config = experiences[type];

  stopMelody();

  document.body.classList.toggle("goodbye-mode", type === "bye");

  homeScreen.classList.add("hidden");
  experienceScreen.classList.remove("hidden");

  experienceArt.style.setProperty("--art-color", config.color);
  experienceSymbol.textContent = config.symbol;
  experienceEyebrow.textContent = config.eyebrow;
  experienceTitle.innerHTML = config.title;
  experienceMessage.textContent = config.message;
  soundIcon.textContent = config.icon;

  createParticles(type);

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Los navegadores permiten iniciar audio tras una interacción.
  startMelody(type);
}

function goHome() {
  stopMelody();

  currentExperience = null;
  homeScreen.classList.remove("hidden");
  experienceScreen.classList.add("hidden");
  document.body.classList.remove("goodbye-mode");

  particles.replaceChildren();

  soundLabel.textContent = "MODO MUSICAL ACTIVADO";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

helloBtn.addEventListener("click", () => {
  openExperience("hello");
});

byeBtn.addEventListener("click", () => {
  openExperience("bye");
});

backBtn.addEventListener("click", goHome);

replayBtn.addEventListener("click", () => {
  if (currentExperience) {
    startMelody(currentExperience);
  }
});

// Reduce el uso de recursos cuando la aplicación queda en segundo plano.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopMelody();
    soundLabel.textContent = "MELODÍA EN PAUSA";
  }
});

// Registrar el Service Worker para instalar y almacenar la PWA.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("HolaMundoApp: PWA preparada."))
      .catch((error) => {
        console.error("No se pudo registrar la PWA:", error);
      });
  });
}

console.log("🚀 HolaMundoApp futurista iniciada.");