import { base44 } from "@/api/base44Client";

let audioContext = null;
let panicIntervalId = null;
let voiceTimeoutId = null;
let panicAudioEl = null;

let tonesCache = {};
let tonesLoadPromise = null;

export function loadNotificationTones() {
  if (tonesLoadPromise) return tonesLoadPromise;
  tonesLoadPromise = (async () => {
    try {
      const list = await base44.entities.CommunitySetting.list();
      if (list.length > 0) tonesCache = list[0].notification_tones || {};
    } catch (e) { /* silent */ }
  })();
  return tonesLoadPromise;
}

export function setTonesCache(tones) { tonesCache = tones || {}; }

function getToneUrl(key) { return tonesCache[key] || null; }

function playCustomTone(url, { loop = false, duration = null } = {}) {
  if (!url) return null;
  try {
    const audio = new Audio(url);
    audio.volume = 1;
    if (loop) audio.loop = true;
    audio.play().catch(() => {});
    if (duration) setTimeout(() => { try { audio.pause(); audio.currentTime = 0; } catch (e) {} }, duration);
    return audio;
  } catch (e) { return null; }
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

// Quick status change beep
export function playStatusBeep() {
  const custom = getToneUrl("status_change");
  if (custom) { playCustomTone(custom); return; }
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { /* silent */ }
}

// Emergency siren wail — plays for 3 seconds, then voice announces the unit
export function startPanicSound(unitName) {
  stopPanicSound();
  const custom = getToneUrl("panic");
  if (custom) {
    panicAudioEl = playCustomTone(custom, { loop: true });
    voiceTimeoutId = setTimeout(() => {
      stopPanicSound();
      if (unitName) speakPanicAlert(unitName);
    }, 3000);
    return;
  }
  try {
    const ctx = getAudioContext();

    const playWail = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.7);
      osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 1.4);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);
      osc.start();
      osc.stop(ctx.currentTime + 1.4);
    };

    playWail();
    panicIntervalId = setInterval(playWail, 1400);

    // After 3 seconds, stop the siren and play the voice announcement
    voiceTimeoutId = setTimeout(() => {
      stopPanicSound();
      if (unitName) speakPanicAlert(unitName);
    }, 3000);
  } catch (e) { /* silent */ }
}

export function stopPanicSound() {
  if (panicIntervalId) { clearInterval(panicIntervalId); panicIntervalId = null; }
  if (voiceTimeoutId) { clearTimeout(voiceTimeoutId); voiceTimeoutId = null; }
  if (panicAudioEl) { try { panicAudioEl.pause(); panicAudioEl.currentTime = 0; } catch (e) {} panicAudioEl = null; }
  stopPanicVoice();
}

// Voice announcement via browser TTS
export function speakPanicAlert(unitName) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Attention all units. Panic button activated by ${unitName}. All available units respond immediately.`
      );
      utterance.rate = 0.95;
      utterance.pitch = 0.7;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) { /* silent */ }
}

export function stopPanicVoice() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) { /* silent */ }
}

// Quick two-tone dispatch beep
export function playDispatchTone() {
  const custom = getToneUrl("new_dispatch") || getToneUrl("signal");
  if (custom) { playCustomTone(custom); return; }
  try {
    const ctx = getAudioContext();
    [0, 0.15].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch (e) { /* silent */ }
}

// Dispatch announcement — tone then voice
export function playDispatchAnnouncement(text) {
  try {
    playDispatchTone();
    setTimeout(() => {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    }, 400);
  } catch (e) { /* silent */ }
}