/**
 * useSoundFX - Efectos de sonido premium generados via Web Audio API.
 * No requiere archivos de audio externos.
 */

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (frequency, type, duration, gainValue, fadeOut = true) => {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime);
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio is blocked
  }
};

const sounds = {
  // Click suave al abrir/seleccionar
  click: () => {
    playTone(880, 'sine', 0.08, 0.08);
  },

  // Éxito - doble tono ascendente (cita completada)
  success: () => {
    playTone(523, 'sine', 0.15, 0.1);
    setTimeout(() => playTone(784, 'sine', 0.25, 0.12), 130);
  },

  // Advertencia - tono bajo para cancelar/reagendar
  warning: () => {
    playTone(440, 'sine', 0.12, 0.08);
    setTimeout(() => playTone(330, 'sine', 0.2, 0.07), 100);
  },

  // Pop suave para abrir modal
  pop: () => {
    playTone(660, 'sine', 0.06, 0.06);
  },

  // Confirmar acción
  confirm: () => {
    playTone(440, 'sine', 0.08, 0.07);
    setTimeout(() => playTone(550, 'sine', 0.08, 0.07), 80);
    setTimeout(() => playTone(660, 'sine', 0.15, 0.09), 160);
  },

  // Cerrar/cancelar
  cancel: () => {
    playTone(400, 'sine', 0.1, 0.06);
  },

  // Hover sobre cita en el grid
  hover: () => {
    playTone(1200, 'sine', 0.04, 0.03);
  },

  // Navegación (volver atrás)
  navigate: () => {
    playTone(500, 'sine', 0.05, 0.05);
    setTimeout(() => playTone(380, 'sine', 0.08, 0.04), 60);
  },
};

const useSoundFX = () => {
  return sounds;
};

export default useSoundFX;
