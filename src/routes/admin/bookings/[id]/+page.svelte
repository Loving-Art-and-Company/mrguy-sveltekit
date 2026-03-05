<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const booking = $derived(data.booking);

	let editing = $state(false);
	let saving = $state(false);
	let updating = $state(false);

	// Editable fields
	let clientName = $state('');
	let phone = $state('');
	let email = $state('');
	let serviceId = $state('');
	let date = $state('');
	let time = $state('');
	let street = $state('');
	let city = $state('');
	let addrState = $state('FL');
	let zip = $state('');
	let editNotes = $state('');
	let price = $state(0);

	function startEdit() {
		clientName = booking.clientName;
		phone = booking.contact;
		// Parse fields from notes
		const addrMatch = booking.notes?.match(/Address:\s*(.+?)(?:,\s*(\w+))(?:,\s*(\w{2}))\s+(\d{5})/);
		const emailMatch = booking.notes?.match(/Email:\s*(\S+)/);
		if (addrMatch) {
			street = addrMatch[1].trim();
			city = addrMatch[2].trim();
			addrState = addrMatch[3] || 'FL';
			zip = addrMatch[4];
		} else {
			// Try simpler parse
			const simpleAddr = booking.notes?.match(/Address:\s*([^\n]+)/);
			if (simpleAddr) {
				const parts = simpleAddr[1].split(',').map(s => s.trim());
				street = parts[0] || '';
				city = parts[1] || '';
				const stateZip = parts[2]?.match(/(\w{2})\s+(\d{5})/);
				if (stateZip) { addrState = stateZip[1]; zip = stateZip[2]; }
			}
		}
		email = emailMatch?.[1] || '';
		// Find service by name
		const svc = data.services.find(s => s.name === booking.serviceName);
		serviceId = svc?.id || '';
		date = booking.date;
		time = booking.time || '';
		price = booking.price;
		// Get notes lines that aren't address/email
		editNotes = (booking.notes || '').split('\n').filter(l =>
			!l.startsWith('Address:') && !l.startsWith('Email:') && !l.startsWith('Created by') && !l.startsWith('Vehicle info pending')
		).join('\n').trim();
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}

	// Close edit mode on successful save
	$effect(() => {
		if (form && 'edited' in form && form.edited) {
			editing = false;
		}
	});

	// ─── Helpers ────────────────────────────
	function fmtPrice(p: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p); }
	function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
	function fmtTime(t: string | null) {
		if (!t) return 'TBD';
		const [h, m] = t.split(':').map(Number);
		return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
	}
	function fmtTs(ts: Date | string | null) {
		if (!ts) return 'N/A';
		return (ts instanceof Date ? ts : new Date(ts)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
	}
	function parseAddr(notes: string | null) { return notes?.match(/Address:\s*([^\n]+)/)?.[1]?.trim() ?? null; }
	function parseEmail(notes: string | null) { return notes?.match(/Email:\s*(\S+)/)?.[1] ?? null; }

	const addr = $derived(parseAddr(booking.notes));
	const clientEmail = $derived(parseEmail(booking.notes));

	const timeSlots = Array.from({ length: 11 }, (_, i) => {
		const h = i + 8;
		return { value: `${String(h).padStart(2, '0')}:00`, label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}` };
	});

	const statuses = [
		{ value: 'pending', label: 'Pending', bg: '#fef3c7', fg: '#92400e', ring: '#f59e0b' },
		{ value: 'confirmed', label: 'Confirmed', bg: '#dbeafe', fg: '#1e40af', ring: '#3b82f6' },
		{ value: 'rescheduled', label: 'Rescheduled', bg: '#e0e7ff', fg: '#3730a3', ring: '#6366f1' },
		{ value: 'cancelled', label: 'Cancelled', bg: '#fee2e2', fg: '#991b1b', ring: '#ef4444' },
		{ value: 'completed', label: 'Completed', bg: '#d1fae5', fg: '#065f46', ring: '#10b981' },
	];
	const paymentStatuses = [
		{ value: 'unpaid', label: 'Unpaid', bg: '#f3f4f6', fg: '#4b5563', ring: '#9ca3af' },
		{ value: 'paid', label: 'Paid', bg: '#d1fae5', fg: '#065f46', ring: '#10b981' },
		{ value: 'refunded', label: 'Refunded', bg: '#fee2e2', fg: '#991b1b', ring: '#ef4444' },
	];

	function getSt(s: string | null) { return statuses.find(x => x.value === s) ?? statuses[0]; }
	function getPs(s: string | null) { return paymentStatuses.find(x => x.value === s) ?? paymentStatuses[0]; }

	const inputStyle = 'width:100%;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:0.375rem;font-size:0.875rem;background:white;color:#1f2937;font-family:inherit;';
	const labelStyle = 'display:block;font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:0.25rem;';
	const valStyle = 'font-size:0.9375rem;color:#1f2937;';
	const cardStyle = 'background:white;padding:1.25rem;border-radius:0.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);';
	const headStyle = 'margin:0 0 1rem;font-size:0.9375rem;font-weight:700;color:#374151;padding-bottom:0.625rem;border-bottom:1px solid #f3f4f6;';
</script>

<svelte:head>
	<title>Booking {booking.id} - Mr. Guy Admin</title>
</svelte:head>

<div style="max-width:900px;">
	<!-- Back + Actions -->
	<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
		<a href="/admin/bookings" style="display:inline-flex;align-items:center;gap:0.375rem;color:#6b7280;text-decoration:none;font-size:0.875rem;">&#8592; Back to Bookings</a>
		{#if !editing}
			<button onclick={startEdit} style="padding:0.5rem 1.25rem;background:#1a1a2e;color:white;border:none;border-radius:0.375rem;font-size:0.8125rem;font-weight:600;cursor:pointer;">Edit Booking</button>
		{/if}
	</div>

	<!-- Header -->
	<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
		<div>
			<h1 style="margin:0 0 0.25rem;font-size:1.5rem;color:#1a1a2e;">{booking.clientName}</h1>
			<p style="margin:0;color:#9ca3af;font-size:0.8125rem;">{booking.id} &middot; Created {fmtTs(booking.createdAt)}</p>
		</div>
		<div style="display:flex;gap:0.5rem;">
			{@const st = getSt(booking.status)}
			{@const ps = getPs(booking.paymentStatus)}
			<span style="padding:0.3125rem 0.875rem;border-radius:9999px;font-size:0.75rem;font-weight:700;text-transform:capitalize;background:{st.bg};color:{st.fg};">{booking.status || 'pending'}</span>
			<span style="padding:0.3125rem 0.875rem;border-radius:9999px;font-size:0.75rem;font-weight:700;text-transform:capitalize;background:{ps.bg};color:{ps.fg};">{booking.paymentStatus || 'unpaid'}</span>
		</div>
	</div>

	{#if editing}
		<!-- ═══ EDIT MODE ═══ -->
		<form
			method="POST"
			action="?/edit"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => { saving = false; await update(); };
			}}
		>
			<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
				<!-- Client -->
				<div style={cardStyle}>
					<h2 style={headStyle}>Client</h2>
					<div style="display:grid;gap:0.875rem;">
						<div>
							<label for="cn" style={labelStyle}>Name *</label>
							<input id="cn" name="clientName" bind:value={clientName} required style={inputStyle} />
						</div>
						<div>
							<label for="ph" style={labelStyle}>Phone *</label>
							<input id="ph" name="phone" bind:value={phone} required style={inputStyle} />
						</div>
						<div>
							<label for="em" style={labelStyle}>Email</label>
							<input id="em" name="email" bind:value={email} type="email" style={inputStyle} />
						</div>
					</div>
				</div>

				<!-- Appointment -->
				<div style={cardStyle}>
					<h2 style={headStyle}>Appointment</h2>
					<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;">
						<div>
							<label for="dt" style={labelStyle}>Date *</label>
							<input id="dt" name="date" type="date" bind:value={date} required style={inputStyle} />
						</div>
						<div>
							<label for="tm" style={labelStyle}>Time *</label>
							<select id="tm" name="time" bind:value={time} required style={inputStyle}>
								{#each timeSlots as s}<option value={s.value}>{s.label}</option>{/each}
							</select>
						</div>
						<div style="grid-column:1/-1;">
							<label for="sv" style={labelStyle}>Service *</label>
							<select id="sv" name="serviceId" bind:value={serviceId} required style={inputStyle}>
								<option value="" disabled>Select...</option>
								{#each data.services as s}<option value={s.id}>{s.name} (${s.priceLow}-${s.priceHigh})</option>{/each}
							</select>
						</div>
						<div>
							<label for="pr" style={labelStyle}>Price ($) *</label>
							<input id="pr" name="price" type="number" bind:value={price} min="0" required style={inputStyle} />
						</div>
					</div>
				</div>

				<!-- Address -->
				<div style="{cardStyle} grid-column:1/-1;">
					<h2 style={headStyle}>Address</h2>
					<div style="display:grid;grid-template-columns:2fr 1fr 0.5fr 0.75fr;gap:0.875rem;">
						<div>
							<label for="st" style={labelStyle}>Street *</label>
							<input id="st" name="street" bind:value={street} required style={inputStyle} />
						</div>
						<div>
							<label for="ct" style={labelStyle}>City *</label>
							<input id="ct" name="city" bind:value={city} required style={inputStyle} />
						</div>
						<div>
							<label for="as" style={labelStyle}>State</label>
							<input id="as" name="state" bind:value={addrState} maxlength="2" style={inputStyle} />
						</div>
						<div>
							<label for="zp" style={labelStyle}>ZIP *</label>
							<input id="zp" name="zip" bind:value={zip} maxlength="5" required style={inputStyle} />
						</div>
					</div>
				</div>

				<!-- Notes -->
				<div style="{cardStyle} grid-column:1/-1;">
					<h2 style={headStyle}>Notes</h2>
					<textarea name="notes" bind:value={editNotes} rows="3" placeholder="Vehicle info, special instructions..." style="{inputStyle} resize:vertical;"></textarea>
				</div>
			</div>

			<!-- Actions -->
			<div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.25rem;">
				<button type="button" onclick={cancelEdit} style="padding:0.625rem 1.25rem;background:white;border:1px solid #d1d5db;border-radius:0.375rem;color:#374151;font-weight:500;font-size:0.875rem;cursor:pointer;">Cancel</button>
				<button type="submit" disabled={saving} style="padding:0.625rem 1.5rem;background:#e94560;color:white;border:none;border-radius:0.375rem;font-weight:700;font-size:0.875rem;cursor:pointer;opacity:{saving ? '0.6' : '1'};">
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	{:else}
		<!-- ═══ VIEW MODE ═══ -->
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
			<!-- Appointment -->
			<div style={cardStyle}>
				<h2 style={headStyle}>Appointment</h2>
				<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
					<div><div style={labelStyle}>Date</div><div style="{valStyle} font-weight:600;">{fmtDate(booking.date)}</div></div>
					<div><div style={labelStyle}>Time</div><div style={valStyle}>{fmtTime(booking.time)}</div></div>
					<div><div style={labelStyle}>Service</div><div style={valStyle}>{booking.serviceName}</div></div>
					<div><div style={labelStyle}>Price</div><div style="{valStyle} font-weight:700;color:#059669;font-size:1.125rem;">{fmtPrice(booking.price)}</div></div>
				</div>
			</div>

			<!-- Client -->
			<div style={cardStyle}>
				<h2 style={headStyle}>Client</h2>
				<div style="display:grid;gap:1rem;">
					<div><div style={labelStyle}>Name</div><div style="{valStyle} font-weight:600;">{booking.clientName}</div></div>
					<div><div style={labelStyle}>Phone</div><a href="tel:{booking.contact}" style="color:#e94560;text-decoration:none;font-weight:500;font-size:0.9375rem;">{booking.contact}</a></div>
					{#if clientEmail}<div><div style={labelStyle}>Email</div><div style={valStyle}>{clientEmail}</div></div>{/if}
					{#if addr}<div><div style={labelStyle}>Address</div><div style={valStyle}>{addr}</div></div>{/if}
				</div>
			</div>

			<!-- Status Controls -->
			<div style="{cardStyle} grid-column:1/-1;">
				<h2 style={headStyle}>Update Status</h2>
				<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
					<div>
						<div style="{labelStyle} margin-bottom:0.625rem;">Booking Status</div>
						<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
							{#each statuses as s}
								{@const isActive = booking.status === s.value || (!booking.status && s.value === 'pending')}
								<form method="POST" action="?/updateStatus" use:enhance={() => { updating = true; return async ({ update }) => { updating = false; await update(); }; }}>
									<input type="hidden" name="status" value={s.value} />
									<button type="submit" disabled={isActive || updating} style="padding:0.4375rem 0.875rem;border-radius:0.375rem;font-size:0.8125rem;font-weight:600;cursor:{isActive ? 'default' : 'pointer'};border:2px solid {isActive ? s.ring : 'transparent'};background:{isActive ? s.bg : '#f9fafb'};color:{isActive ? s.fg : '#6b7280'};opacity:{updating && !isActive ? '0.5' : '1'};">{s.label}</button>
								</form>
							{/each}
						</div>
					</div>
					<div>
						<div style="{labelStyle} margin-bottom:0.625rem;">Payment Status</div>
						<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
							{#each paymentStatuses as ps}
								{@const isActive = booking.paymentStatus === ps.value || (!booking.paymentStatus && ps.value === 'unpaid')}
								<form method="POST" action="?/updatePaymentStatus" use:enhance={() => { updating = true; return async ({ update }) => { updating = false; await update(); }; }}>
									<input type="hidden" name="paymentStatus" value={ps.value} />
									<button type="submit" disabled={isActive || updating} style="padding:0.4375rem 0.875rem;border-radius:0.375rem;font-size:0.8125rem;font-weight:600;cursor:{isActive ? 'default' : 'pointer'};border:2px solid {isActive ? ps.ring : 'transparent'};background:{isActive ? ps.bg : '#f9fafb'};color:{isActive ? ps.fg : '#6b7280'};opacity:{updating && !isActive ? '0.5' : '1'};">{ps.label}</button>
								</form>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Notes -->
			{#if booking.notes}
				<div style="{cardStyle} grid-column:1/-1;">
					<h2 style={headStyle}>Notes</h2>
					<div style="background:#f9fafb;padding:0.875rem;border-radius:0.5rem;font-size:0.875rem;color:#4b5563;white-space:pre-wrap;line-height:1.6;">{booking.notes}</div>
				</div>
			{/if}

			<!-- System -->
			<div style="{cardStyle} grid-column:1/-1;background:#fafafa;">
				<h2 style="margin:0 0 1rem;font-size:0.9375rem;font-weight:700;color:#9ca3af;padding-bottom:0.625rem;border-bottom:1px solid #f3f4f6;">Payment & System</h2>
				<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
					<div><div style={labelStyle}>Payment Method</div><div style={valStyle}>{booking.paymentMethod || 'N/A'}</div></div>
					{#if booking.promoCode}<div><div style={labelStyle}>Promo Code</div><div style="{valStyle} font-weight:600;color:#7c3aed;">{booking.promoCode}</div></div>{/if}
					<div><div style={labelStyle}>Reminder Sent</div><div style={valStyle}>{booking.reminderSent ? 'Yes' : 'No'}</div></div>
				</div>
			</div>
		</div>
	{/if}
</div>
