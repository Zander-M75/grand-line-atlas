/**
 * "Which episode are you on?": an episode number, or an arc to take it from, or "I'm caught
 * up". Used by the spoiler prompt and the settings menu.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { arcById, arcs } from '@/data';
import type { Arc } from '@/types';
import styles from './SpoilerForm.module.css';

interface SpoilerFormProps {
  /** The episode to start from, or null for an empty field. */
  initial: number | null;
  submitLabel: string;
  /** The chosen episode, or null for "caught up". */
  onChoose: (episode: number | null) => void;
  /** Focus the episode field as soon as the form appears. */
  autoFocus?: boolean;
}

export function SpoilerForm({
  initial,
  submitLabel,
  onChoose,
  autoFocus = false,
}: SpoilerFormProps) {
  const id = useId();
  const [episode, setEpisode] = useState(initial === null ? '' : String(initial));
  const [arcId, setArcId] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = episode.trim();
    if (!/^\d+$/.test(value) || Number(value) < 1) {
      setError('Enter an episode number, like 300.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    onChoose(Number(value));
  }

  // Picking an arc fills in its first episode: you've started it, but nothing past that.
  function pickArc(id: string) {
    setArcId(id);
    const arc = arcById.get(id);
    if (arc) {
      setEpisode(String(arc.episodes[0]));
      setError('');
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.label} htmlFor={`${id}-episode`}>
        Last episode you’ve watched
      </label>
      <div className={styles.row}>
        <input
          ref={inputRef}
          id={`${id}-episode`}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 300"
          value={episode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setEpisode(event.target.value);
            setArcId('');
          }}
        />
        <button type="submit" className={styles.primary}>
          {submitLabel}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}

      <label className={styles.label} htmlFor={`${id}-arc`}>
        Or the arc you’re on
      </label>
      <select
        id={`${id}-arc`}
        className={styles.select}
        value={arcId}
        aria-describedby={`${id}-arc-hint`}
        onChange={(event) => pickArc(event.target.value)}
      >
        <option value="">Choose an arc…</option>
        {SAGAS.map(({ saga, arcs }) => (
          <optgroup key={saga} label={saga}>
            {arcs.map((arc) => (
              <option key={arc.id} value={arc.id}>
                {arc.filler ? `${arc.name} (anime-only)` : arc.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p id={`${id}-arc-hint`} className={styles.hint}>
        Heads up: names further down the list can hint at what’s ahead.
      </p>

      <button type="button" className={styles.secondary} onClick={() => onChoose(null)}>
        I’m caught up
      </button>
    </form>
  );
}

/** Every arc, grouped by saga in airing order, for the picker. */
const SAGAS = arcs.reduce<{ saga: string; arcs: Arc[] }[]>((groups, arc) => {
  const last = groups.at(-1);
  if (last?.saga === arc.saga) last.arcs.push(arc);
  else groups.push({ saga: arc.saga, arcs: [arc] });
  return groups;
}, []);
