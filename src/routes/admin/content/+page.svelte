<script lang="ts">
  import { Sparkles, Copy, Check, RefreshCw, Instagram, Facebook, Twitter } from 'lucide-svelte';
  
  let postType = $state('promo');
  let tone = $state('professional');
  let topic = $state('');
  let generatedContent = $state('');
  let loading = $state(false);
  let copied = $state(false);
  let error = $state('');

  const postTypes = [
    { id: 'promo', label: 'Promotion', description: 'Sales, discounts, special offers' },
    { id: 'tip', label: 'Detailing Tip', description: 'Car care advice and tricks' },
    { id: 'before-after', label: 'Before/After', description: 'Showcase transformation results' },
    { id: 'testimonial', label: 'Testimonial', description: 'Customer review highlight' },
    { id: 'seasonal', label: 'Seasonal', description: 'Weather/holiday related content' },
  ];

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly & Casual' },
    { id: 'enthusiastic', label: 'Enthusiastic' },
    { id: 'luxury', label: 'Luxury & Premium' },
  ];

  async function generateContent() {
    console.log('Generate clicked, topic:', topic);
    if (!topic.trim()) {
      error = 'Please enter a topic or idea';
      return;
    }
    
    loading = true;
    error = '';
    generatedContent = '';
    
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postType, tone, topic })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const data = await response.json();
      generatedContent = data.content;
    } catch (e) {
      error = 'Failed to generate content. Please try again.';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(generatedContent);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<svelte:head>
  <title>AI Content Generator - Mr. Guy Detail</title>
</svelte:head>

<div class="content-page">
  <header class="page-header">
    <div class="header-content">
      <Sparkles size={32} class="header-icon" />
      <div>
        <h1>AI Content Generator</h1>
        <p>Create engaging social media posts for your detailing business</p>
      </div>
    </div>
  </header>

  <div class="generator-container">
    <div class="input-section">
      <div class="form-group">
        <label>Post Type</label>
        <div class="post-types">
          {#each postTypes as type}
            <button
              class="type-btn"
              class:active={postType === type.id}
              onclick={() => postType = type.id}
            >
              <span class="type-label">{type.label}</span>
              <span class="type-desc">{type.description}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label>Tone</label>
        <div class="tone-options">
          {#each tones as t}
            <button
              class="tone-btn"
              class:active={tone === t.id}
              onclick={() => tone = t.id}
            >
              {t.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="topic">Topic or Idea</label>
        <textarea
          id="topic"
          value={topic}
          oninput={(e) => topic = e.currentTarget.value}
          placeholder="E.g., 'Spring cleaning special', 'Why ceramic coating is worth it', 'Weekend availability'"
          rows="3"
        ></textarea>
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <button class="generate-btn" type="button" onclick={() => generateContent()} disabled={loading}>
        {#if loading}
          <RefreshCw size={20} class="spinning" />
          Generating...
        {:else}
          <Sparkles size={20} />
          Generate Content
        {/if}
      </button>
    </div>

    <div class="output-section">
      <div class="output-header">
        <h2>Generated Content</h2>
        {#if generatedContent}
          <button class="copy-btn" onclick={copyToClipboard}>
            {#if copied}
              <Check size={16} />
              Copied!
            {:else}
              <Copy size={16} />
              Copy
            {/if}
          </button>
        {/if}
      </div>
      
      <div class="output-content">
        {#if generatedContent}
          <p class="generated-text">{generatedContent}</p>
          
          <div class="share-buttons">
            <span class="share-label">Share to:</span>
            <button class="share-btn instagram" title="Copy for Instagram">
              <Instagram size={18} />
            </button>
            <button class="share-btn facebook" title="Copy for Facebook">
              <Facebook size={18} />
            </button>
            <button class="share-btn twitter" title="Copy for Twitter/X">
              <Twitter size={18} />
            </button>
          </div>
        {:else}
          <p class="placeholder">Your generated content will appear here...</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .content-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-content :global(.header-icon) {
    color: #e94560;
  }

  h1 {
    margin: 0;
    font-size: 1.75rem;
    color: #1a1a2e;
  }

  .page-header p {
    margin: 0.25rem 0 0 0;
    color: #6b7280;
  }

  .generator-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .input-section, .output-section {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
  }

  .post-types {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .type-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .type-btn:hover {
    border-color: #e94560;
  }

  .type-btn.active {
    border-color: #e94560;
    background: #fef2f2;
  }

  .type-label {
    font-weight: 600;
    color: #1a1a2e;
  }

  .type-desc {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .tone-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tone-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 2rem;
    background: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .tone-btn:hover {
    border-color: #e94560;
  }

  .tone-btn.active {
    border-color: #e94560;
    background: #e94560;
    color: white;
  }

  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: #e94560;
  }

  .error-message {
    color: #dc2626;
    background: #fef2f2;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .generate-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .generate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .output-header h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #1a1a2e;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
    color: #374151;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .output-content {
    min-height: 200px;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .placeholder {
    color: #9ca3af;
    font-style: italic;
    margin: 0;
  }

  .generated-text {
    margin: 0 0 1.5rem 0;
    line-height: 1.6;
    white-space: pre-wrap;
    color: #1a1a2e;
  }

  .share-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .share-label {
    font-size: 0.85rem;
    color: #6b7280;
  }

  .share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .share-btn:hover {
    transform: scale(1.1);
  }

  .share-btn.instagram {
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
    color: white;
  }

  .share-btn.facebook {
    background: #1877f2;
    color: white;
  }

  .share-btn.twitter {
    background: #000;
    color: white;
  }

  @media (max-width: 900px) {
    .generator-container {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .content-page {
      padding: 1rem;
    }

    .tone-options {
      flex-direction: column;
    }

    .tone-btn {
      width: 100%;
      text-align: center;
    }
  }
</style>
