<script lang="ts">
  /**
   * OtpInput - 6-digit OTP code input
   * - Auto-advances on input
   * - Supports paste
   * - Backspace moves to previous field
   */

  interface Props {
    value: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: string) => void;
    oncomplete?: (value: string) => void;
  }

  let { value = $bindable(''), disabled = false, error = '', onchange, oncomplete }: Props = $props();

  const LENGTH = 6;
  let inputs: HTMLInputElement[] = [];
  let digits = $state<string[]>(Array(LENGTH).fill(''));

  // Sync value prop to digits array
  $effect(() => {
    if (value) {
      const chars = value.replace(/\D/g, '').slice(0, LENGTH).split('');
      digits = [...chars, ...Array(LENGTH - chars.length).fill('')];
    }
  });

  // Sync digits array to value
  function updateValue() {
    const newValue = digits.join('');
    value = newValue;
    onchange?.(newValue);

    if (newValue.length === LENGTH) {
      oncomplete?.(newValue);
    }
  }

  function handleInput(index: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const inputValue = target.value;

    // Handle paste
    if (inputValue.length > 1) {
      const pastedDigits = inputValue.replace(/\D/g, '').slice(0, LENGTH).split('');
      digits = [...pastedDigits, ...Array(LENGTH - pastedDigits.length).fill('')];
      updateValue();

      // Focus last filled or next empty
      const focusIndex = Math.min(pastedDigits.length, LENGTH - 1);
      inputs[focusIndex]?.focus();
      return;
    }

    // Single character input
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    digits[index] = digit;
    updateValue();

    // Auto-advance
    if (digit && index < LENGTH - 1) {
      inputs[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent) {
    // Backspace: clear current and move back
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputs[index - 1]?.focus();
      }
      digits[index] = '';
      updateValue();
      return;
    }

    // Left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1]?.focus();
      e.preventDefault();
      return;
    }

    // Right arrow
    if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      inputs[index + 1]?.focus();
      e.preventDefault();
      return;
    }

    // Only allow digits
    if (!/^\d$/.test(e.key) && !['Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text') || '';
    const pastedDigits = pastedText.replace(/\D/g, '').slice(0, LENGTH).split('');

    if (pastedDigits.length > 0) {
      digits = [...pastedDigits, ...Array(LENGTH - pastedDigits.length).fill('')];
      updateValue();

      const focusIndex = Math.min(pastedDigits.length, LENGTH - 1);
      inputs[focusIndex]?.focus();
    }
  }

  function handleFocus(e: FocusEvent) {
    (e.target as HTMLInputElement).select();
  }

  const groupId = $derived(`otp-group-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="otp-wrapper">
  <div
    class="otp-inputs"
    class:invalid={error}
    role="group"
    aria-label="Verification code"
    aria-describedby={error ? `${groupId}-error` : undefined}
  >
    {#each digits as digit, i}
      <input
        type="text"
        inputmode="numeric"
        maxlength="6"
        aria-label="Digit {i + 1} of {LENGTH}"
        aria-invalid={!!error}
        {disabled}
        value={digit}
        bind:this={inputs[i]}
        oninput={(e) => handleInput(i, e)}
        onkeydown={(e) => handleKeyDown(i, e)}
        onpaste={handlePaste}
        onfocus={handleFocus}
        class="otp-digit"
        class:filled={digit}
        autocomplete="one-time-code"
      />
    {/each}
  </div>
  {#if error}
    <span id="{groupId}-error" class="error-message" role="alert">{error}</span>
  {/if}
</div>

<style>
  .otp-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .otp-inputs {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .otp-digit {
    width: 3rem;
    height: 3.5rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    font-family: monospace;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .otp-digit:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }

  .otp-digit.filled {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .otp-digit:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  .otp-inputs.invalid .otp-digit {
    border-color: #dc2626;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.85rem;
    text-align: center;
  }

  @media (max-width: 400px) {
    .otp-digit {
      width: 2.5rem;
      height: 3rem;
      font-size: 1.25rem;
    }

    .otp-inputs {
      gap: 0.35rem;
    }
  }
</style>
