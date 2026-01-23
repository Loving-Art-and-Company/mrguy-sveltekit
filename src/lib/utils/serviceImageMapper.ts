// Maps service packages to before/after images
// Gold → Exterior, Platinum → Interior, Diamond → Headlight

export interface ServiceImages {
	before: string;
	after: string;
}

const IMAGE_MAP: Record<string, ServiceImages> = {
	gold: {
		before: '/images/before-after/exterior-before.webp',
		after: '/images/before-after/exterior-after.webp'
	},
	platinum: {
		before: '/images/before-after/interior-before.webp',
		after: '/images/before-after/interior-after.webp'
	},
	diamond: {
		before: '/images/before-after/headlight-before.webp',
		after: '/images/before-after/headlight-after.webp'
	}
};

export function getServiceImages(packageId: string): ServiceImages {
	return IMAGE_MAP[packageId.toLowerCase()] || IMAGE_MAP.gold;
}

// Preload images for better UX
export function preloadServiceImages(): void {
	if (typeof window === 'undefined') return;

	Object.values(IMAGE_MAP).forEach(({ before, after }) => {
		const imgBefore = new Image();
		imgBefore.src = before;
		const imgAfter = new Image();
		imgAfter.src = after;
	});
}
