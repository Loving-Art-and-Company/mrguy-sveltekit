<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Admin Login - Mr. Guy Detail</title>
</svelte:head>

<main class="login-container">
  <div class="login-card">
    <h1>Admin Login</h1>
    <p class="subtitle">Mr. Guy Mobile Detail Dashboard</p>

    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
    >
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="admin@example.com"
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="Enter your password"
        />
      </div>

      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
</main>

<style>
  .login-container {
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
    border-radius: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 400px;
  }

  h1 {
    margin: 0 0 0.25rem 0;
    font-size: 1.75rem;
    color: #1a1a2e;
    text-align: center;
  }

  .subtitle {
    color: #6b7280;
    text-align: center;
    margin: 0 0 2rem 0;
    font-size: 0.9rem;
  }

  .field {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #e94560;
    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
  }

  input::placeholder {
    color: #9ca3af;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
    border: 1px solid #fecaca;
  }

  button {
    width: 100%;
    padding: 0.875rem 1rem;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }

  button:hover:not(:disabled) {
    background: #ff6b6b;
    transform: translateY(-1px);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
