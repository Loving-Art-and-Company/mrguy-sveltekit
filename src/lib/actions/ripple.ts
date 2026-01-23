export function ripple(node: HTMLElement) {
	function handleClick(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const rippleElement = document.createElement('span');
		rippleElement.className = 'ripple-effect';
		rippleElement.style.left = `${x}px`;
		rippleElement.style.top = `${y}px`;

		node.appendChild(rippleElement);

		setTimeout(() => rippleElement.remove(), 600);
	}

	node.addEventListener('click', handleClick);
	node.classList.add('ripple-container');

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
}
