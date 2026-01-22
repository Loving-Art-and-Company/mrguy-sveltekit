<script lang="ts">
  interface Props {
    size?: number;
    opacity?: number;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    delay?: number;
  }

  let {
    size = 20,
    opacity = 0.2,
    top,
    left,
    right,
    bottom,
    delay = 0
  }: Props = $props();

  const style = $derived(`
    --sparkle-size: ${size}px;
    --sparkle-opacity: ${opacity};
    --sparkle-delay: ${delay}s;
    ${top ? `top: ${top};` : ''}
    ${left ? `left: ${left};` : ''}
    ${right ? `right: ${right};` : ''}
    ${bottom ? `bottom: ${bottom};` : ''}
  `);
</script>

<svg
  class="sparkle"
  {style}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M12 0C12 8 8 12 0 12C8 12 12 16 12 24C12 16 16 12 24 12C16 12 12 8 12 0Z"
    fill="var(--sparkle-color)"
    opacity="var(--sparkle-opacity)"
  />
</svg>

<style>
  .sparkle {
    position: absolute;
    pointer-events: none;
    animation: sparkle-pulse 3s ease-in-out infinite;
    animation-delay: var(--sparkle-delay);
  }

  @keyframes sparkle-pulse {
    0%, 100% {
      opacity: var(--sparkle-opacity);
      transform: scale(1) rotate(0deg);
    }
    50% {
      opacity: calc(var(--sparkle-opacity) * 1.5);
      transform: scale(1.1) rotate(180deg);
    }
  }
</style>
