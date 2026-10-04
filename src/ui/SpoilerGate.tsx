/**
 * The spoiler prompt, a modal over the whole app (which is inert behind it).
 *
 * - First visit: asks which episode the viewer is on before showing anything past the first
 *   one. It needs an answer, so Escape doesn't close it; "I'm caught up" is one click away.
 * - A link past their limit: says so without naming what's there, and offers to update the
 *   limit or stay where they are (Escape stays).
 *
 * The answer is saved on this device; Settings can change it later.
 */
import { AnimatePresence, m } from 'framer-motion';
import { useId, type KeyboardEvent } from 'react';
import { MOTION_EASE } from '@/animation/easing';
import { APP_TITLE, TIMING } from '@/config';
import { useMotionTransition } from '@/hooks/useMotionTransition';
import { chooseSpoilerLimit, dismissGate, useAtlasStore, type Gate } from '@/store';
import { SpoilerForm } from './SpoilerForm';
import styles from './SpoilerGate.module.css';

export function SpoilerGate() {
  const gate = useAtlasStore((state) => state.gate);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const introPlaying = useAtlasStore((state) => state.introPlaying);
  return (
    <AnimatePresence>
      {/* On a first visit, the question waits for the intro to finish. */}
      {gate && !introPlaying && <GateDialog key="gate" gate={gate} limit={limit} />}
    </AnimatePresence>
  );
}

function GateDialog({ gate, limit }: { gate: Gate; limit: number | null }) {
  const headingId = useId();
  const textId = useId();
  const transition = useMotionTransition({ duration: TIMING.panel, ease: MOTION_EASE.enter });
  const welcome = gate.reason === 'welcome';
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (!welcome) dismissGate();
  };

  return (
    <m.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <m.div
        className={styles.dialog}
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 8, scale: 0.98 }}
        transition={transition}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={textId}
        onKeyDown={onKeyDown}
      >
        <p className={styles.eyebrow}>{APP_TITLE}</p>
        {welcome ? (
          <>
            <h2 id={headingId} className={styles.heading}>
              Where are you in the story?
            </h2>
            <p id={textId} className={styles.text}>
              Tell us the last episode you’ve watched, and the map stops there: no later arcs,
              islands, or crew.
              {gate.requestedArcId && ' Your link opens once you’ve reached it.'}
            </p>
          </>
        ) : (
          <>
            <h2 id={headingId} className={styles.heading}>
              This link goes past your episode
            </h2>
            <p id={textId} className={styles.text}>
              It opens an arc that starts after episode {limit}, where you’re up to. Update your
              episode to see it, or stay spoiler-free.
            </p>
          </>
        )}

        <SpoilerForm
          initial={welcome ? null : limit}
          submitLabel={welcome ? 'Set sail' : 'Update'}
          onChoose={chooseSpoilerLimit}
          autoFocus
        />

        {!welcome && (
          <button type="button" className={styles.stay} onClick={dismissGate}>
            Stay at episode {limit}
          </button>
        )}
        <p className={styles.footnote}>Saved on this device. Change it any time in Settings.</p>
      </m.div>
    </m.div>
  );
}
