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

<div class="container">
  <h1>AI Content Generator</h1>
  <p class="subtitle">Generate social media posts and marketing content with AI</p>
  
  <form onsubmit={handleSubmit}>
    <div class="field">
      <label for="topic">Topic or Idea</label>
      <textarea
        id="topic"
        bind:value={topic}
        placeholder="E.g., rainy season special, weekend promo, ceramic coating benefits"
        rows="3"
      ></textarea>
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <button type="submit" class="generate-btn" disabled={loading}>
      {loading ? 'Generating...' : 'Generate Content'}
    </button>
  </form>

  {#if result}
    <div class="result">
      <h2>Generated Content</h2>
      <div class="result-content">{result}</div>
      <button 
        type="button" 
        class="copy-btn"
        onclick={() => navigator.clipboard.writeText(result)}
      >
        Copy to Clipboard
      </button>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a1a2e;
  }

  .subtitle {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .field {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
  }

  textarea {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: #e94560;
  }

  .error {
    background: #fee2e2;
    color: #dc2626;
    padding: 0.875rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .generate-btn {
    padding: 1rem 2rem;
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
    transform: translateY(-2px);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .result {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .result h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #1a1a2e;
  }

  .result-content {
    white-space: pre-wrap;
    line-height: 1.6;
    color: #374151;
    margin-bottom: 1rem;
  }

  .copy-btn {
    padding: 0.5rem 1rem;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .copy-btn:hover {
    background: #16213e;
  }
</style>
