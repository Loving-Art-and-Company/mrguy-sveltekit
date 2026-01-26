<script lang="ts">
  import { enhance } from '$app/forms';
  import { Phone } from 'lucide-svelte';

  let { form } = $props();
  
  let phone = $state('');
  let otp = $state('');
  let step = $state<'phone' | 'otp'>('phone');
  let loading = $state(false);
  let error = $state('');

  // Format phone number as user types
  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function handlePhoneInput(e: Event) {
    const input = e.target as HTMLInputElement;
    phone = formatPhone(input.value);
  }

  async function sendOtp() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      error = 'Please enter a valid 10-digit phone number';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${digits}` })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send code');
      }

      step = 'otp';
    } catch (e: any) {
      error = e.message || 'Failed to send verification code';
    } finally {
      loading = false;
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      error = 'Please enter the 6-digit code';
      return;
    }

    loading = true;
    error = '';

    const digits = phone.replace(/\D/g, '');

    try {
      const response = await fetch('/api/auth/client-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: `+1${digits}`,
          code: otp 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Redirect to portal on success
      window.location.href = '/portal';
    } catch (e: any) {
      error = e.message || 'Failed to verify code';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In - Mr. Guy Mobile Detail</title>
</svelte:head>

<div class="login-page">
  <div class="login-card">
    <img src="/logo/mrguylogo-full-square.png" alt="Mr. Guy Detail" class="logo" />
    <h1>Client Portal</h1>
    <p class="subtitle">Sign in to manage your appointments and packages</p>

    {#if step === 'phone'}
      <div class="form-section">
        <label for="phone">Phone Number</label>
        <div class="input-wrapper">
          <Phone size={20} class="input-icon" />
          <input
            id="phone"
            type="tel"
            placeholder="(954) 555-1234"
            value={phone}
            oninput={handlePhoneInput}
            maxlength="14"
          />
        </div>
        <p class="helper">We'll send a verification code to this number</p>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button class="submit-btn" onclick={sendOtp} disabled={loading}>
          {loading ? 'Sending...' : 'Send Code'}
        </button>
      </div>

    {:else}
      <div class="form-section">
        <p class="code-sent">
          Code sent to <strong>{phone}</strong>
        </p>
        
        <label for="otp">Verification Code</label>
        <input
          id="otp"
          type="text"
          inputmode="numeric"
          placeholder="123456"
          bind:value={otp}
          maxlength="6"
          class="otp-input"
        />

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button class="submit-btn" onclick={verifyOtp} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <button class="back-btn" onclick={() => { step = 'phone'; error = ''; otp = ''; }}>
          Use a different number
        </button>
      </div>
    {/if}

    <p class="new-customer">
      New customer? <a href="/book">Book your first appointment</a>
    </p>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 1rem;
  }

  .login-card {
    background: white;
    padding: 2.5rem;
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 420px;
    text-align: center;
  }

  .logo {
    height: 80px;
    margin-bottom: 1.5rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    color: #1a1a2e;
  }

  .subtitle {
    color: #6b7280;
    margin: 0 0 2rem 0;
  }

  .form-section {
    text-align: left;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .input-wrapper {
    position: relative;
  }

  .input-wrapper :global(.input-icon) {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #e94560;
  }

  .otp-input {
    padding-left: 1rem;
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    font-weight: 600;
  }

  .helper {
    color: #9ca3af;
    font-size: 0.85rem;
    margin: 0.5rem 0 1.5rem 0;
  }

  .code-sent {
    background: #d1fae5;
    color: #059669;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    background: #d63850;
    transform: translateY(-2px);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .back-btn {
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .back-btn:hover {
    color: #374151;
    text-decoration: underline;
  }

  .new-customer {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .new-customer a {
    color: #e94560;
    text-decoration: none;
    font-weight: 600;
  }

  .new-customer a:hover {
    text-decoration: underline;
  }
</style>
