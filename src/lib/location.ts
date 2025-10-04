export interface SimpleLocation {
	latitude: number;
	longitude: number;
	locationName?: string;
}

export async function getCurrentPositionOnce(options?: PositionOptions): Promise<GeolocationPosition> {
	return await new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new Error('Geolocation not available'));
			return;
		}
		navigator.geolocation.getCurrentPosition(resolve, reject, options);
	});
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
	try {
		// Use Nominatim (OpenStreetMap) anonymous reverse geocoding. Keep it lightweight.
		const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
		const resp = await fetch(url, {
			headers: { 'Accept': 'application/json' },
		});
		if (!resp.ok) return undefined;
		const data: any = await resp.json();
		const display: string | undefined = data?.display_name || data?.name;
		return display;
	} catch {
		return undefined;
	}
}

export async function getSimpleLocation(options?: PositionOptions): Promise<SimpleLocation | undefined> {
	try {
		const pos = await getCurrentPositionOnce(options);
		const latitude = pos.coords.latitude;
		const longitude = pos.coords.longitude;
		const locationName = await reverseGeocode(latitude, longitude);
		return { latitude, longitude, locationName };
	} catch {
		return undefined;
	}
}


