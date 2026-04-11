import { useCallback, useRef, useState } from "react";

// Pentatonic scale frequencies (C4 pentatonic: C D E G A)
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

// Chord voicings as indices into PENTATONIC
const CHORDS = [
  [0, 2, 4], // C E G
  [1, 3, 5], // D G C5
  [2, 4, 6], // E A D5
  [0, 3, 5], // C G C5
];

interface MusicNodes {
  ctx: AudioContext;
  master: GainNode;
  oscillators: OscillatorNode[];
  gains: GainNode[];
  intervalId: ReturnType<typeof setInterval>;
}

export function useAmbientMusic() {
  const [playing, setPlaying] = useState(false);
  const nodesRef = useRef<MusicNodes | null>(null);
  const chordIndexRef = useRef(0);

  const buildReverb = (ctx: AudioContext): ConvolverNode => {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 2.5;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  };

  const crossfadeChord = useCallback((nodes: MusicNodes) => {
    chordIndexRef.current = (chordIndexRef.current + 1) % CHORDS.length;
    const chord = CHORDS[chordIndexRef.current];

    nodes.oscillators.forEach((osc, i) => {
      const target = PENTATONIC[chord[i] ?? 0];
      // Slightly detune each voice for warmth
      const detune = (i - 1) * 4;
      osc.frequency.setTargetAtTime(target, nodes.ctx.currentTime, 1.2);
      osc.detune.setTargetAtTime(detune, nodes.ctx.currentTime, 0.5);

      // Gentle volume swell
      const targetGain = i === 0 ? 0.06 : 0.04;
      nodes.gains[i].gain.setTargetAtTime(targetGain, nodes.ctx.currentTime, 0.8);
    });
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 2);

    const reverb = buildReverb(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.4;

    master.connect(ctx.destination);
    master.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    const initialChord = CHORDS[0];
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    initialChord.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = PENTATONIC[noteIdx];
      osc.detune.value = (i - 1) * 4;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.06 : 0.04, ctx.currentTime + 2);

      osc.connect(gain);
      gain.connect(master);
      osc.start();

      oscillators.push(osc);
      gains.push(gain);
    });

    // Also add a soft sub-bass drone
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = "sine";
    bass.frequency.value = 130.81; // C3
    bassGain.gain.setValueAtTime(0, ctx.currentTime);
    bassGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 3);
    bass.connect(bassGain);
    bassGain.connect(master);
    bass.start();
    oscillators.push(bass);
    gains.push(bassGain);

    // Chord change every 6 seconds
    const intervalId = setInterval(() => {
      if (nodesRef.current) crossfadeChord(nodesRef.current);
    }, 6000);

    nodesRef.current = { ctx, master, oscillators, gains, intervalId };
  }, [crossfadeChord]);

  const stop = useCallback(() => {
    const nodes = nodesRef.current;
    /* c8 ignore next */
    if (!nodes) return;

    clearInterval(nodes.intervalId);

    // Fade out then close
    nodes.master.gain.setTargetAtTime(0, nodes.ctx.currentTime, 0.5);
    setTimeout(() => {
      /* c8 ignore next 2 */
      nodes.oscillators.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      nodes.ctx.close();
      nodesRef.current = null;
    }, 2000);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      start();
      setPlaying(true);
    }
  }, [playing, start, stop]);

  return { playing, toggle };
}
