<script lang="ts">
  /**
   * PhoneInput - Reusable phone input with US format masking
   * Formats as user types: (555) 555-5555
   * Exposes clean digits via `value` prop
   */

  interface Props {
    value: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: string) => void;
  }

  let { value = $bindable(''), placeholder = '(954) 555-1234', disabled = false, error = '', onchange }: Props = $props();

  let displayValue = $state('');

  // Format digits to (XXX) XXX-XXXX
  function formatPhone(digits: string): string {
    const cleaned = digits.replace(/\D/g, '').slice(0, 10);

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Extract digits from formatted string
  function extractDigits(formatted: string): string {
    return formatted.replace(/\D/g, '').slice(0, 10);
  }

  // Initialize display from value
  $effect(() => {
    if (value && !displayValue) {
      displayValue = formatPhone(value);
    }
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const digits = extractDigits(target.value);
    displayValue = formatPhone(digits);
    value = digits;
    onchange?.(digits);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Allow backspace to work naturally
    if (e.key === 'Backspace') {
      return;
    }
    // Only allow digits, navigation keys, and modifiers
    if (!/^\d$/.test(e.key) && !['Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  let isValid = $derived(value.length === 10);
  const inputId = $derived(`phone-input-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="phone-input-wrapper">
  <input
    id={inputId}
    type="tel"
    inputmode="numeric"
    aria-label="Phone number"
    aria-invalid={!!error}
    aria-describedby={error ? `${inputId}-error` : undefined}
    {placeholder}
    {disabled}
    value={displayValue}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    class="phone-input"
    class:invalid={error}
    class:valid={isValid && !error}
    autocomplete="tel"
  />
  {#if error}
    <span id="{inputId}-error" class="error-message" role="alert">{error}</span>
  {/if}
</div>

<style>
  .phone-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  .phone-input {
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    text-align: center;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .phone-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  .phone-input.invalid {
    border-color: #dc2626;
  }

  .phone-input.invalid:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .phone-input.valid {
    border-color: #10b981;
  }

  .phone-input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.85rem;
    text-align: center;
  }
</style>
