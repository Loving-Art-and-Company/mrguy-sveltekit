// Google Maps API loader with retry and error handling
// Implements singleton pattern to prevent multiple script loads

let googleMapsPromise: Promise<void> | null = null;
let scriptLoaded = false;

export function loadGoogleMapsApi(): Promise<void> {
	// Return existing promise if already loading
	if (googleMapsPromise) {
		return googleMapsPromise;
	}

	// Check if already loaded
	// @ts-ignore - Google Maps API loaded dynamically
	if (scriptLoaded || (typeof google !== 'undefined' && google.maps)) {
		scriptLoaded = true;
		return Promise.resolve();
	}

	googleMapsPromise = new Promise((resolve, reject) => {
		// Check for API key
		const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY;
		if (!apiKey || apiKey === 'your_api_key_here') {
			console.warn('[Google Maps] API key not configured, falling back to manual entry');
			googleMapsPromise = null;
			reject(new Error('Google Maps API key not configured'));
			return;
		}

		// Create script tag
		const script = document.createElement('script');
		const callbackName = 'initGoogleMaps_' + Date.now();
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
		script.async = true;
		script.defer = true;

		// Global callback
		(window as any)[callbackName] = () => {
			delete (window as any)[callbackName];
			scriptLoaded = true;
			resolve();
		};

		script.onerror = () => {
			googleMapsPromise = null; // Allow retry
			reject(new Error('Failed to load Google Maps API'));
		};

		document.head.appendChild(script);

		// Timeout after 10 seconds
		setTimeout(() => {
			if (!scriptLoaded) {
				googleMapsPromise = null;
				reject(new Error('Google Maps API load timeout'));
			}
		}, 10000);
	});

	return googleMapsPromise;
}

// Check if Google Maps is available
export function isGoogleMapsLoaded(): boolean {
	// @ts-ignore - Google Maps API loaded dynamically
	return scriptLoaded && typeof google !== 'undefined' && !!google.maps;
}
