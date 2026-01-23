<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { loadGoogleMapsApi } from '$lib/utils/googleMapsLoader';

	interface PlaceResult {
		address: string;
		city: string;
		state: string;
		zip: string;
		placeId: string;
	}

	export let value = '';
	export let city = '';
	export let state = '';
	export let zip = '';
	export let error: string | null = null;
	export let onPlaceSelected: ((place: PlaceResult) => void) | undefined = undefined;

	let inputElement: HTMLInputElement;
	let autocomplete: any = null;
	let showManualEntry = false;
	let googleApiLoaded = false;
	let apiError = false;

	onMount(async () => {
		try {
			await loadGoogleMapsApi();
			googleApiLoaded = true;
			initAutocomplete();
		} catch (err) {
			console.warn('Google Maps API failed to load, showing manual entry:', err);
			apiError = true;
			showManualEntry = true;
		}
	});

	function initAutocomplete() {
		if (!inputElement || !googleApiLoaded) return;

		// @ts-ignore - Google Maps API loaded dynamically
		autocomplete = new google.maps.places.Autocomplete(inputElement, {
			types: ['address'],
			componentRestrictions: { country: 'us' },
			fields: ['address_components', 'formatted_address', 'place_id']
		});

		autocomplete.addListener('place_changed', handlePlaceChanged);
	}

	function handlePlaceChanged() {
		const place = autocomplete?.getPlace();
		if (!place || !place.address_components) return;

		const result = parseAddressComponents(place.address_components, place);

		// Update bound values
		value = result.address;
		city = result.city;
		state = result.state;
		zip = result.zip;

		// Call callback if provided
		onPlaceSelected?.(result);
	}

	function parseAddressComponents(
		components: any[],
		place: any
	): PlaceResult {
		const getComponent = (type: string, useShort = false) => {
			const comp = components.find((c) => c.types.includes(type));
			return useShort ? (comp?.short_name || '') : (comp?.long_name || '');
		};

		const streetNumber = getComponent('street_number');
		const route = getComponent('route');
		const address = `${streetNumber} ${route}`.trim() || place.formatted_address || '';

		return {
			address,
			city: getComponent('locality') || getComponent('sublocality'),
			state: getComponent('administrative_area_level_1', true),
			zip: getComponent('postal_code'),
			placeId: place.place_id || ''
		};
	}

	onDestroy(() => {
		if (autocomplete) {
			// @ts-ignore - Google Maps API loaded dynamically
			google.maps.event.clearInstanceListeners(autocomplete);
		}
	});
</script>

{#if !showManualEntry}
	<div class="autocomplete-wrapper">
		<label for="address-autocomplete" class="label">
			Street Address
			<span class="required">*</span>
		</label>
		<input
			id="address-autocomplete"
			type="text"
			bind:this={inputElement}
			bind:value
			placeholder="Start typing your address..."
			class="input"
			class:error={!!error}
			aria-describedby={error ? 'address-error' : undefined}
			autocomplete="off"
		/>
		{#if error}
			<span id="address-error" class="error-message">{error}</span>
		{/if}
		<button type="button" class="link-button" on:click={() => (showManualEntry = true)}>
			Enter address manually
		</button>
	</div>
{:else}
	<div class="manual-entry">
		<label for="manual-address" class="label">
			Street Address
			<span class="required">*</span>
		</label>
		<input
			id="manual-address"
			type="text"
			bind:value
			placeholder="123 Main Street"
			class="input"
			class:error={!!error}
		/>

		<div class="address-grid">
			<div>
				<label for="manual-city" class="label">
					City
					<span class="required">*</span>
				</label>
				<input id="manual-city" type="text" bind:value={city} placeholder="Fort Lauderdale" class="input" />
			</div>

			<div>
				<label for="manual-state" class="label">
					State
					<span class="required">*</span>
				</label>
				<input id="manual-state" type="text" bind:value={state} class="input" maxlength="2" placeholder="FL" />
			</div>

			<div>
				<label for="manual-zip" class="label">
					ZIP Code
					<span class="required">*</span>
				</label>
				<input
					id="manual-zip"
					type="text"
					bind:value={zip}
					placeholder="33301"
					class="input"
					maxlength="5"
					pattern="[0-9]*"
					inputmode="numeric"
				/>
			</div>
		</div>

		{#if error}
			<span class="error-message">{error}</span>
		{/if}

		{#if googleApiLoaded}
			<button type="button" class="link-button" on:click={() => (showManualEntry = false)}>
				Use address autocomplete
			</button>
		{/if}
	</div>
{/if}

<style>
	.autocomplete-wrapper,
	.manual-entry {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.required {
		color: var(--color-error);
	}

	.input {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-light);
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
		background: white;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.input.error {
		border-color: var(--color-error);
	}

	.input::placeholder {
		color: var(--text-muted);
	}

	.address-grid {
		display: grid;
		grid-template-columns: 1fr 80px 120px;
		gap: 0.75rem;
	}

	.error-message {
		color: var(--color-error);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.link-button {
		background: none;
		border: none;
		color: var(--color-primary);
		text-decoration: underline;
		cursor: pointer;
		padding: 0.5rem 0;
		text-align: left;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.link-button:hover {
		color: var(--color-primary-hover);
	}

	@media (max-width: 640px) {
		.address-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
