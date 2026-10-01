import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';
import { APP_TITLE } from '@/config';

describe('App', () => {
  it('shows the app title as the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: APP_TITLE })).toBeInTheDocument();
  });
});
