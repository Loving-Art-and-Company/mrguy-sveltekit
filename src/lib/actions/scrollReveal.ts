export function scrollReveal(
	node: HTMLElement,
	params: {
		animation: string;
		threshold?: number;
		delay?: number;
	}
) {
	const { animation, threshold = 0.2, delay = 0 } = params;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						node.classList.add('reveal');
					}, delay);
					observer.unobserve(node);
				}
			});
		},
		{
			threshold,
			rootMargin: '0px 0px -50px 0px'
		}
	);

	node.classList.add(animation);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
