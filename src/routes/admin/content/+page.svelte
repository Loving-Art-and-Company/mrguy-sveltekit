<script lang="ts">
  let topic = $state('');
  let result = $state('');
  let loading = $state(false);
  let error = $state('');

  async function generateContent() {
    if (!topic.trim()) {
      error = 'Please enter a topic';
      return;
    }
    
    loading = true;
    error = '';
    result = '';
    
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postType: 'promo', tone: 'friendly', topic })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }
      
      const data = await res.json();
      result = data.content;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate content';
    } finally {
      loading = false;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    generateContent();
  }
</script>

<svelte:head>
  <title>AI Content Generator - Mr. Guy Detail</title>
</svelte:head>

<div class="content-generator">
  <div class="card">
    <h2>AI Content Generator</h2>
    <p class="subtitle">Generate social media posts and marketing content with AI</p>
    
    <form onsubmit={handleSubmit}>
      <div class="field">
        <label for="topic">Topic or Idea</label>
        <textarea
          id="topic"
          bind:value={topic}
          placeholder="E.g., rainy season special, weekend promo, ceramic coating benefits"
          rows="4"
        ></textarea>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <button type="submit" class="generate-btn" disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
          Generating...
        {:else}
          Generate Content
        {/if}
      </button>
    </form>
  </div>

  {#if result}
    <div class="card result">
      <h3>Generated Content</h3>
      <div class="result-content">{result}</div>
      <div class="result-actions">
        <button 
          type="button" 
          class="copy-btn"
          onclick={() => {
            navigator.clipboard.writeText(result);
            alert('Copied to clipboard!');
          }}
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .content-generator {
    max-width: 800px;
  }

  .card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    color: #1a1a2e;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    color: #1a1a2e;
  }

  .subtitle {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    font-size: 0.9rem;
  }

  .field {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }

  textarea {
    width: 100%;
    padding: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: #e94560;
    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
  }

  .error {
    background: #fee2e2;
    color: #dc2626;
    padding: 0.875rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .generate-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .generate-btn:hover:not(:disabled) {
    background: #d63850;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .result {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .result-content {
    white-space: pre-wrap;
    line-height: 1.7;
    color: #374151;
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    font-size: 0.95rem;
  }

  .result-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.75rem;
  }

  .copy-btn {
    padding: 0.625rem 1rem;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .copy-btn:hover {
    background: #2d2d4a;
  }
</style>
