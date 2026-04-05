import { render, screen } from '@testing-library/react';
import App from './App';

test('button works', () => {
    render(<App />);
    const btn = screen.getByText('Visualize Input');
    expect(btn).toBeInTheDocument();
});