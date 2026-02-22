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

	it('renders phone number link', () => {
		render(Header);
		const phoneLink = screen.getByRole('link', { name: /call us/i });
		expect(phoneLink).toHaveAttribute('href', 'tel:+19548044747');
	});

	it('has correct href for logo', () => {
		render(Header);
		const logoLink = screen.getByRole('link', { name: 'Mr. Guy Mobile Detail' });
		expect(logoLink).toHaveAttribute('href', '/');
	});

	it('has correct href for Book Now link', () => {
		render(Header);
		const bookLink = screen.getByRole('link', { name: 'Book Now' });
		expect(bookLink).toHaveAttribute('href', '/#services');
	});

	it('has correct href for My Booking link', () => {
		render(Header);
		const bookingLink = screen.getByRole('link', { name: 'My Booking' });
		expect(bookingLink).toHaveAttribute('href', '/reschedule');
	});
});
