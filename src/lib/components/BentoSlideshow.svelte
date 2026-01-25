<script lang="ts">
  import { onMount } from 'svelte';
  
  let currentSlide = $state(0);
  let autoplayInterval: NodeJS.Timeout;

  const slides = [
    {
      title: "Ceramic Protection",
      subtitle: "Long-lasting shine",
      description: "Multi-year protection that keeps your paint looking showroom fresh",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: "✨"
    },
    {
      title: "Paint Correction",
      subtitle: "Flawless finish",
      description: "Remove swirls, scratches, and oxidation for a mirror-like surface",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icon: "🎨"
    },
    {
      title: "Interior Deep Clean",
      subtitle: "Fresh & pristine",
      description: "Every surface cleaned, conditioned, and protected",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: "🚗"
    },
    {
      title: "Mobile Service",
      subtitle: "We come to you",
      description: "Professional detailing at your home or office",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      icon: "📍"
    },
    {
      title: "Same-Day Available",
      subtitle: "Book today, clean today",
      description: "Quick turnaround without compromising quality",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      icon: "⚡"
    }
  ];

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
  }

  function goToSlide(index: number) {
    currentSlide = index;
    resetAutoplay();
  }

  function resetAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  onMount(() => {
    resetAutoplay();
    return () => {
      if (autoplayInterval) clearInterval(autoplayInterval);
    };
  });
</script>

<section class="bento-slideshow">
  <div class="slides-container">
    {#each slides as slide, i (i)}
      <div 
        class="slide" 
        class:active={currentSlide === i}
        style="background: {slide.gradient}"
      >
        <div class="slide-content">
          <div class="icon">{slide.icon}</div>
          <h3>{slide.title}</h3>
          <p class="subtitle">{slide.subtitle}</p>
          <p class="description">{slide.description}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="dots">
    {#each slides as _, i}
      <button 
        class="dot" 
        class:active={currentSlide === i}
        onclick={() => goToSlide(i)}
        aria-label="Go to slide {i + 1}"
      />
    {/each}
  </div>
</section>

<style>
  .bento-slideshow {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .slides-container {
    position: relative;
    width: 100%;
    height: 500px;
    border-radius: 2rem;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slide.active {
    opacity: 1;
    transform: scale(1);
    z-index: 1;
  }

  .slide-content {
    text-align: center;
    color: white;
    padding: 2rem;
    max-width: 600px;
  }

  .icon {
    font-size: 5rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  .slide-content h3 {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
    opacity: 0.9;
  }

  .description {
    font-size: 1.1rem;
    opacity: 0.8;
    line-height: 1.6;
    margin: 0;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }

  .dot:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.2);
  }

  .dot.active {
    background: rgba(0, 0, 0, 0.8);
    width: 30px;
    border-radius: 5px;
  }

  @media (max-width: 768px) {
    .slides-container {
      height: 400px;
      border-radius: 1.5rem;
    }

    .icon {
      font-size: 3.5rem;
    }

    .slide-content h3 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1.2rem;
    }

    .description {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .slides-container {
      height: 350px;
    }

    .slide-content h3 {
      font-size: 1.75rem;
    }
  }
</style>
