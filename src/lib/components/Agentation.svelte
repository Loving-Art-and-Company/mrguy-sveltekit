<script lang="ts">
  /**
   * Agentation for Svelte
   * Visual feedback for AI coding agents
   *
   * Based on the React version by Benji Taylor
   * Ported to Svelte by Abdias @ Loving Art & Company
   */

  import { browser } from '$app/environment';

  interface Annotation {
    element: string;
    elementPath: string;
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    attributes: Record<string, string>;
    timestamp: string;
  }

  interface Props {
    onAnnotationAdd?: (annotation: Annotation) => void;
    copyToClipboard?: boolean;
    enabled?: boolean;
  }

  let { onAnnotationAdd, copyToClipboard = true, enabled = true }: Props = $props();

  // State
  let isActive = $state(false);
  let overlay = $state<HTMLDivElement | null>(null);
  let highlightBox = $state<HTMLDivElement | null>(null);
  let currentElement = $state<Element | null>(null);
  let annotations = $state<Annotation[]>([]);

  $effect(() => {
    if (!browser || !enabled) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toggleActive();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      cleanup();
    };
  });

  function toggleActive() {
    isActive = !isActive;

    if (isActive) {
      createOverlay();
      document.body.style.cursor = 'crosshair';
    } else {
      cleanup();
    }
  }

  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.05); z-index: 999998; pointer-events: none;
    `;
    document.body.appendChild(overlay);

    highlightBox = document.createElement('div');
    highlightBox.style.cssText = `
      position: fixed; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1);
      pointer-events: none; z-index: 999999; display: none;
    `;
    document.body.appendChild(highlightBox);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
  }

  function cleanup() {
    document.body.style.cursor = '';

    if (overlay) {
      overlay.remove();
      overlay = null;
    }

    if (highlightBox) {
      highlightBox.remove();
      highlightBox = null;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleEscape);

    currentElement = null;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isActive || !highlightBox) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);

    if (!element || element === overlay || element === highlightBox) {
      highlightBox.style.display = 'none';
      currentElement = null;
      return;
    }

    currentElement = element;
    const rect = element.getBoundingClientRect();

    highlightBox.style.display = 'block';
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  function handleClick(e: MouseEvent) {
    if (!isActive || !currentElement) return;

    e.preventDefault();
    e.stopPropagation();

    captureAnnotation(currentElement);
    toggleActive();
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && isActive) {
      toggleActive();
    }
  }

  function captureAnnotation(element: Element) {
    const rect = element.getBoundingClientRect();

    const annotation: Annotation = {
      element: element.tagName.toLowerCase(),
      elementPath: getElementPath(element),
      text: element.textContent?.trim() || '',
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      attributes: getElementAttributes(element),
      timestamp: new Date().toISOString(),
    };

    annotations = [...annotations, annotation];

    if (copyToClipboard) {
      const formatted = formatAnnotation(annotation);
      navigator.clipboard.writeText(formatted).catch((err) => {
        console.error('Failed to copy annotation:', err);
      });
    }

    if (onAnnotationAdd) {
      onAnnotationAdd(annotation);
    }
  }

  function getElementPath(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).join('.');
        if (classes) selector += `.${classes}`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  function getElementAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    for (const attr of Array.from(element.attributes)) {
      attrs[attr.name] = attr.value;
    }

    return attrs;
  }

  function formatAnnotation(annotation: Annotation): string {
    return `Element: ${annotation.element}
Path: ${annotation.elementPath}
Text: ${annotation.text}
Position: x=${annotation.boundingBox.x}, y=${annotation.boundingBox.y}
Size: ${annotation.boundingBox.width}x${annotation.boundingBox.height}
Attributes: ${JSON.stringify(annotation.attributes, null, 2)}
Timestamp: ${annotation.timestamp}`;
  }
</script>

{#if browser && enabled}
  <div class="agentation-indicator" class:active={isActive}>
    <button
      onclick={toggleActive}
      title="Toggle annotation mode (Cmd/Ctrl + Shift + A)"
      class="agentation-toggle"
    >
      {#if isActive}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" stroke="currentColor" stroke-width="2" rx="1"/>
          <circle cx="8" cy="8" r="2" fill="currentColor"/>
        </svg>
      {/if}
    </button>
    
    {#if isActive}
      <div class="agentation-hint">
        Click element to annotate • ESC to cancel
      </div>
    {/if}
    
    {#if annotations.length > 0}
      <div class="agentation-count">
        {annotations.length}
      </div>
    {/if}
  </div>
{/if}

<style>
  .agentation-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 999997;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .agentation-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: #3b82f6;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: all 0.2s;
  }

  .agentation-toggle:hover {
    background: #2563eb;
    transform: scale(1.05);
  }

  .agentation-toggle:active {
    transform: scale(0.95);
  }

  .agentation-indicator.active .agentation-toggle {
    background: #ef4444;
  }

  .agentation-indicator.active .agentation-toggle:hover {
    background: #dc2626;
  }

  .agentation-hint {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    animation: slideIn 0.2s ease-out;
  }

  .agentation-count {
    background: #10b981;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
