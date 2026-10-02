/**
 * The app's few icons, drawn here as simple strokes (no icon set). They take the current
 * text color and are hidden from screen readers; the button or link around each one names it.
 */
import type { SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="m4 4 8 8M12 4l-8 8" />
    </Icon>
  );
}

/** Three sliders: settings. */
export function SettingsIcon() {
  return (
    <Icon>
      <path d="M2 4h12M2 8h12M2 12h12" strokeOpacity="0.55" />
      <circle cx="5.5" cy="4" r="1.6" fill="currentColor" />
      <circle cx="10.5" cy="8" r="1.6" fill="currentColor" />
      <circle cx="6.5" cy="12" r="1.6" fill="currentColor" />
    </Icon>
  );
}

/** Leaves the site (opens in a new tab). */
export function ExternalIcon() {
  return (
    <Icon width="12" height="12">
      <path d="M9 3h4v4M13 3 7.5 8.5M11.5 9.5V13h-9V4H6" />
    </Icon>
  );
}

export function ChevronIcon() {
  return (
    <Icon width="12" height="12">
      <path d="m4 6 4 4 4-4" />
    </Icon>
  );
}
