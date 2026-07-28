import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer Component Unit Test (frontend)', () => {
  it('renders department title and club branding', () => {
    render(<Footer />);

    expect(screen.getByText("CSEDU Students' Club")).toBeInTheDocument();
    expect(screen.getByText("Dept. of CSE, University of Dhaka")).toBeInTheDocument();
  });

  it('renders navigation quick links', () => {
    render(<Footer />);

    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Elections')).toBeInTheDocument();
  });

  it('renders team credit', () => {
    render(<Footer />);

    expect(screen.getByText('Team Formula1')).toBeInTheDocument();
  });
});
