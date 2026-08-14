import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import DemoQuiz from './DemoQuiz.jsx';

describe('adaptateur QCM démonstration', () => {
  it('reprend la session, passe par la revue et focalise le résultat puis la correction', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('qcm_demo_progress', JSON.stringify({
      answers: { 0: 1, 1: 0, 2: 2, 3: 1 },
    }));

    render(<MemoryRouter><DemoQuiz /></MemoryRouter>);
    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Question 5 sur 5');
    await user.click(screen.getByRole('radio', { name: 'Une comparaison documentée avant/après' }));
    await user.click(screen.getByRole('button', { name: /relire mes réponses/i }));
    expect(screen.getByRole('heading', { name: 'Vérifiez vos réponses' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /voir mon résultat/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Évaluation terminée' })).toHaveFocus());
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(sessionStorage.getItem('qcm_demo_progress')).toBeNull();

    await user.click(screen.getByRole('button', { name: /voir ma correction/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Correction détaillée' })).toHaveFocus());
  });
});
