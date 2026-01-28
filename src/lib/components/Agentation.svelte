<script>
  /**
   * Agentation for Svelte
   * Visual feedback for AI coding agents
   * 
   * Based on the React version by Benji Taylor
   * Ported to Svelte by Abdias @ Loving Art & Company
   */
  
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Props
  export let onAnnotationAdd = undefined;
  export let copyToClipboard = true;
  export let enabled = true;

  // State
  let isActive = false;
  let overlay = null;
  let highlightBox = null;
  let currentElement = null;
  let annotations = [];

  // Annotation type
  /**
   * @typedef {Object} Annotation
   * @property {string} element - Element tag name
   * @property {string} elementPath - Full CSS selector path
   * @property {string} text - Element text content
   * @property {Object} boundingBox - Element dimensions
   * @property {number} boundingBox.x
   * @property {number} boundingBox.y
   * @property {number} boundingBox.width
   * @property {number} boundingBox.height
   * @property {Object} attributes - Element attributes
   * @property {string} screenshot - Data URL of element screenshot (optional)
   * @property {string} timestamp - ISO timestamp
   */

  onMount(() => {
    if (!browser || !enabled) return;

    // Keyboard shortcut (Cmd/Ctrl + Shift + A)
    const handleKeydown = (e) => {
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

    // Create overlay element
    overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.05);
      z-index: 999998;
      pointer-events: none;
    `;
    document.body.appendChild(overlay);

    // Create highlight box
    highlightBox = document.createElement('div');
    highlightBox.style.cssText = `
      position: fixed;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;
    document.body.appendChild(highlightBox);

    // Add event listeners
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

  function handleMouseMove(e) {
    if (!isActive) return;

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

  function handleClick(e) {
    if (!isActive || !currentElement) return;

    e.preventDefault();
    e.stopPropagation();

    captureAnnotation(currentElement);
    toggleActive(); // Exit annotation mode after capture
  }

  function handleEscape(e) {
    if (e.key === 'Escape' && isActive) {
      toggleActive();
    }
  }

  function captureAnnotation(element) {
    const rect = element.getBoundingClientRect();
    
    const annotation = {
      element: element.tagName.toLowerCase(),
      elementPath: getElementPath(element),
      text: element.textContent?.trim() || '',
      boundingBox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      attributes: getElementAttributes(element),
      timestamp: new Date().toISOString()
    };

    annotations = [...annotations, annotation];

    // Copy to clipboard if enabled
    if (copyToClipboard) {
      const formatted = formatAnnotation(annotation);
      navigator.clipboard.writeText(formatted).then(() => {
        console.log('✓ Annotation copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy annotation:', err);
      });
    }

    // Call callback if provided
    if (onAnnotationAdd) {
      onAnnotationAdd(annotation);
    }
  }

  function getElementPath(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        const classes = Array.from(current.classList).join('.');
        if (classes) selector += `.${classes}`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  function getElementAttributes(element) {
    const attrs = {};
    
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }

    return attrs;
  }

  function formatAnnotation(annotation) {
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
      on:click={toggleActive}
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
