<script lang="ts">
  let topic = '';
  let result = '';
  let loading = false;
  let error = '';

  function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!topic.trim()) {
      error = 'Please enter a topic';
      return;
    }
    
    loading = true;
    error = '';
    result = '';
    
    fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postType: 'promo', tone: 'friendly', topic })
    })
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => {
        result = data.content;
      })
      .catch(err => {
        error = err.message || 'Failed to generate content';
      })
      .finally(() => {
        loading = false;
      });
  }
</script>

<svelte:head>
  <title>AI Content Generator - Mr. Guy Detail</title>
</svelte:head>

<div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
  <h1>AI Content Generator</h1>
  
  <form on:submit={handleSubmit}>
    <div style="margin-bottom: 1rem;">
      <label for="topic" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
        Topic or Idea
      </label>
      <textarea
        id="topic"
        bind:value={topic}
        placeholder="E.g., rainy season special"
        rows="3"
        style="width: 100%; padding: 0.75rem; border: 2px solid #ccc; border-radius: 0.5rem; font-size: 1rem;"
      ></textarea>
    </div>

    {#if error}
      <p style="color: red; background: #fee; padding: 0.75rem; border-radius: 0.5rem;">{error}</p>
    {/if}

    <button 
      type="submit" 
      disabled={loading}
      style="padding: 1rem 2rem; background: #e94560; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;"
    >
      {loading ? 'Generating...' : 'Generate Content'}
    </button>
  </form>

  {#if result}
    <div style="margin-top: 2rem; padding: 1.5rem; background: #f5f5f5; border-radius: 0.5rem;">
      <h2>Generated Content</h2>
      <p style="white-space: pre-wrap;">{result}</p>
    </div>
  {/if}
</div>
