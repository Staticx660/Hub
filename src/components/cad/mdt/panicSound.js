let audioContext = null;
let intervalId = null;

export function startPanicSound() {
  stopPanicSound();
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const playTone = (freq) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
      osc.start();
      osc.stop(audioContext.currentTime + 0.35);
    };
    let high = true;
    playTone(1000);
    intervalId = setInterval(() => {
      playTone(high ? 1000 : 600);
      high = !high;
    }, 400);
  } catch (e) { console.error('Audio error:', e); }
}

export function stopPanicSound() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}