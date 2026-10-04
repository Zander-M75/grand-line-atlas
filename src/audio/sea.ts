/**
 * The atlas's sound, synthesized in the browser with the Web Audio API: no audio files at
 * all, so nothing to license or download.
 *
 * - The sea: noise, filtered down to a low wash, swelling and ebbing on two slow, unrelated
 *   cycles so the waves never quite repeat.
 * - A chime: a soft bell (a few sine partials, struck and left to ring) for a new crewmate.
 *
 * Sound only ever starts from the viewer turning it on: setSound(true) must run inside that
 * click, since browsers (Safari strictly) let audio start only from a user's action. Until
 * then nothing is created, and the code itself is small enough not to need lazy loading.
 */

/** Overall loudness. Ambient means barely there. */
const LEVEL = { sea: 0.05, chime: 0.07 };
/** Fades in and out, in seconds, so the sea never starts or stops abruptly. */
const FADE = 1.6;

interface SeaSound {
  setPlaying(playing: boolean): void;
  chime(): void;
}

let sound: SeaSound | null = null;

/** Turns the sea on or off, starting the audio on first use. Call it from the viewer's click. */
export function setSound(on: boolean) {
  if (on && !sound && typeof AudioContext !== 'undefined') sound = createSeaSound();
  sound?.setPlaying(on);
}

/** Rings the chime, if sound is on. */
export function chime() {
  sound?.chime();
}

function createSeaSound(): SeaSound {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const sea = context.createGain();
  sea.gain.value = LEVEL.sea;
  sea.connect(master);
  swell(context, 0.075, 0.6, sea);
  swell(context, 0.031, 0.35, sea);
  waves(context).connect(sea);

  let playing = false;
  let pause: number | undefined;
  return {
    setPlaying(on) {
      playing = on;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 1 : 0, now + FADE);
      window.clearTimeout(pause);
      // Once faded out, stop the audio altogether until it's turned back on.
      if (on) void context.resume();
      else pause = window.setTimeout(() => void context.suspend(), FADE * 1000);
    },
    chime() {
      if (playing) ring(context, master);
    },
  };
}

/** Looping noise through a low-pass filter: the hiss of water, without its sharpness. */
function waves(context: AudioContext): AudioNode {
  const seconds = 4;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown noise: each sample a small random step from the last, which weights it low.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  // Tilt it so it ends where it began, or the loop would click every few seconds.
  const end = data.length - 1;
  const drift = (data[end] ?? 0) - (data[0] ?? 0);
  for (let i = 0; i <= end; i++) data[i] = (data[i] ?? 0) - (drift * i) / end;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  source.connect(filter);
  source.start();
  return filter;
}

/** Slowly raises and lowers a gain: one wave's rise and fall every 1/frequency seconds. */
function swell(context: AudioContext, frequency: number, depth: number, target: GainNode) {
  const oscillator = context.createOscillator();
  oscillator.frequency.value = frequency;
  const amount = context.createGain();
  amount.gain.value = LEVEL.sea * depth;
  oscillator.connect(amount).connect(target.gain);
  oscillator.start();
}

/** One soft bell strike: a fundamental and two quieter, higher partials, ringing out. */
function ring(context: AudioContext, output: AudioNode) {
  const now = context.currentTime;
  const partials = [
    { ratio: 1, level: 1, decay: 2.2 },
    { ratio: 2.76, level: 0.35, decay: 1.2 },
    { ratio: 5.4, level: 0.12, decay: 0.6 },
  ];
  for (const { ratio, level, decay } of partials) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 659.25 * ratio; // E5
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(LEVEL.chime * level, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    oscillator.connect(gain).connect(output);
    oscillator.start(now);
    oscillator.stop(now + decay);
  }
}
