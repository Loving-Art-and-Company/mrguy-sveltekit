import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Header from './Header.svelte';

describe('Header', () => {
	it('renders the business name as logo', () => {
		render(Header);
		expect(screen.getByText('Mr. Guy Mobile Detail')).toBeInTheDocument();
	});

	it('renders navigation links', () => {
		render(Header);
		expect(screen.getByRole('link', { name: 'Book Now' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'My Booking' })).toBeInTheDocument();
	});

	it('renders login button by default', () => {
		render(Header);
		expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
	});

	it('hides login button when showLogin is false', () => {
		render(Header, { props: { showLogin: false } });
		expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
	});

	it('has correct href for login button', () => {
		render(Header);
		const loginLink = screen.getByRole('link', { name: /login/i });
		expect(loginLink).toHaveAttribute('href', '/login');
	});

	it('has correct href for logo', () => {
		render(Header);
		const logoLink = screen.getByRole('link', { name: 'Mr. Guy Mobile Detail' });
		expect(logoLink).toHaveAttribute('href', '/');
	});

	it('has correct href for Book Now link', () => {
		render(Header);
		const bookLink = screen.getByRole('link', { name: 'Book Now' });
		expect(bookLink).toHaveAttribute('href', '/book');
	});

	it('has correct href for My Booking link', () => {
		render(Header);
		const bookingLink = screen.getByRole('link', { name: 'My Booking' });
		expect(bookingLink).toHaveAttribute('href', '/reschedule');
	});
});
