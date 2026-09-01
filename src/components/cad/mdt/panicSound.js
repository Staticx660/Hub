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

// Plays a configured tone by key; falls back to the built-in beep when none is set.
export function playToneKey(key) {
  const custom = getToneUrl(key);
  if (custom) { playCustomTone(custom); return; }
  if (key === "new_dispatch" || key === "signal") playDispatchTone();
  else playStatusBeep();
}

// Browsers block audio until the page has had a user gesture. Prime the audio
// context and speech engine on the first click/key so alerts fire later.
let unlockInstalled = false;
export function installAudioUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const unlock = () => {
    try { getAudioContext(); } catch (e) {}
    try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(""); u.volume = 0; window.speechSynthesis.speak(u); } } catch (e) {}
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export function speak(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 0.9; u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* silent */ }
}

// Postal codes are read digit-by-digit ("postal four one two")
const spellPostal = (p) => String(p || "").trim().split("").join(" ");

export function dispatchVoiceText(call, session) {
  const unit = session?.callsign || session?.user_name || "Unit";
  const parts = [`${unit}, you are attached to ${call.call_type || "a call"}`];
  if (call.location) parts.push(`at ${call.location}`);
  if (call.postal) parts.push(`postal ${spellPostal(call.postal)}`);
  if (call.priority) parts.push(`priority ${call.priority.charAt(0)}`);
  return parts.join(", ") + ".";
}

// Unit attached to a call — dispatch tone, then AI voice with call type, location and postal
export function announceUnitAttached(call, session) {
  playToneKey("new_dispatch");
  setTimeout(() => speak(dispatchVoiceText(call, session)), 700);
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