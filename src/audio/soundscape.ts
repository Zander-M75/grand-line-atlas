/**
 * The optional sound (PLAN.md §7 Phase 6): a low wash of waves, and a soft chime when someone
 * joins the crew. Both are synthesized with the Web Audio API, so there are no audio files to
 * ship or credit. This module is loaded only once the viewer turns sound on.
 */

/** Overall loudness; the waves sit well under it. */
const VOLUME = 0.5;
const WAVES = { level: 0.09, cutoff: 520, swellHz: 0.09, swellDepth: 0.6 };
const FADE = 0.8;

export interface Soundscape {
  /** Fades the waves in (resuming audio if the browser had suspended it). */
  play(): void;
  /** Fades everything out and suspends audio. */
  pause(): void;
  /** A soft two-note chime. */
  chime(): void;
}

export function createSoundscape(): Soundscape {
  const audio = new AudioContext();
  const master = audio.createGain();
  master.gain.value = 0;
  master.connect(audio.destination);

  // Waves: brown noise (deep rumble), low-passed, its level swelling slowly up and down.
  const noise = audio.createBufferSource();
  noise.buffer = brownNoise(audio, 6);
  noise.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = WAVES.cutoff;
  const waves = audio.createGain();
  waves.gain.value = WAVES.level;
  const swell = audio.createOscillator();
  swell.frequency.value = WAVES.swellHz;
  const swellDepth = audio.createGain();
  swellDepth.gain.value = WAVES.level * WAVES.swellDepth;
  swell.connect(swellDepth).connect(waves.gain);
  noise.connect(filter).connect(waves).connect(master);
  noise.start();
  swell.start();

  let pausing: number | undefined;

  return {
    play() {
      window.clearTimeout(pausing);
      void audio.resume();
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(VOLUME, audio.currentTime, FADE / 3);
    },
    pause() {
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setTargetAtTime(0, audio.currentTime, FADE / 3);
      window.clearTimeout(pausing);
      pausing = window.setTimeout(() => void audio.suspend(), FADE * 1000);
    },
    chime() {
      if (audio.state !== 'running') return;
      // A fifth apart, the second note a beat later: bright, short, and quiet.
      bell(audio, master, 659.25, audio.currentTime);
      bell(audio, master, 987.77, audio.currentTime + 0.12);
    },
  };
}

function bell(audio: AudioContext, out: AudioNode, frequency: number, at: number) {
  const tone = audio.createOscillator();
  tone.type = 'sine';
  tone.frequency.value = frequency;
  const level = audio.createGain();
  level.gain.setValueAtTime(0, at);
  level.gain.linearRampToValueAtTime(0.16, at + 0.01);
  level.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
  tone.connect(level).connect(out);
  tone.start(at);
  tone.stop(at + 1.5);
}

/** `seconds` of brown noise: white noise, integrated, so the energy sits in the lows. */
function brownNoise(audio: AudioContext, seconds: number): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}
