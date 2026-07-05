let audioContext = null;
let panicIntervalId = null;
let voiceTimeoutId = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

// Quick status change beep
export function playStatusBeep() {
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