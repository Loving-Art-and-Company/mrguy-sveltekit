<script lang="ts">
  import { onMount } from 'svelte';
  
  let currentSlide = $state(0);
  let autoplayInterval: NodeJS.Timeout;

  const slides = [
    {
      title: "We Come To You",
      subtitle: "Mobile detailing",
      description: "Professional detailing right in your driveway",
      image: "/images/slide-1.jpg"
    },
    {
      title: "Showroom Shine",
      subtitle: "Exterior detailing",
      description: "Your car looking brand new, wherever you park it",
      image: "/images/slide-2.jpg"
    },
    {
      title: "Detail Obsessed",
      subtitle: "Every surface",
      description: "We don't miss a spot",
      image: "/images/slide-3.jpg"
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
      >
        <img src={slide.image} alt={slide.title} class="slide-image" />
        <div class="slide-overlay"></div>
        <div class="slide-content">
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
      ></button>
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
    border-radius: 2.5rem;
    overflow: hidden;
    box-shadow: 
      0 25px 80px rgba(0, 0, 0, 0.25),
      0 10px 30px rgba(0, 0, 0, 0.15),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transform: scale(1.1);
    transition: 
      opacity 1s cubic-bezier(0.23, 1, 0.32, 1),
      transform 1.2s cubic-bezier(0.23, 1, 0.32, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .slide.active {
    opacity: 1;
    transform: scale(1);
    z-index: 1;
  }

  .slide-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .slide.active .slide-image {
    transform: scale(1.1);
  }

  .slide-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg, 
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0.7) 100%
    );
    z-index: 1;
  }

  .slide-content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: white;
    padding: 2rem;
    max-width: 700px;
    transform: translateY(20px);
    opacity: 0;
    transition: 
      transform 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.3s,
      opacity 0.8s ease 0.3s;
  }

  .slide.active .slide-content {
    transform: translateY(0);
    opacity: 1;
  }

  .slide-content h3 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.1;
    letter-spacing: -0.03em;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    font-size: clamp(1.25rem, 2.5vw, 1.75rem);
    font-weight: 500;
    margin: 0 0 1rem 0;
    opacity: 0.9;
    letter-spacing: -0.01em;
  }

  .description {
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    opacity: 0.85;
    line-height: 1.6;
    margin: 0;
    font-weight: 400;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(14, 165, 233, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 0;
    position: relative;
  }

  .dot::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--color-primary);
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .dot:hover {
    background: rgba(14, 165, 233, 0.4);
    transform: scale(1.2);
  }

  .dot.active {
    background: transparent;
    width: 32px;
    border-radius: 6px;
  }

  .dot.active::after {
    transform: translate(-50%, -50%) scale(1);
    border-radius: 6px;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    .slides-container {
      height: 450px;
      border-radius: 2rem;
    }

    .slide-content h3 {
      font-size: 2.25rem;
    }

    .subtitle {
      font-size: 1.25rem;
    }

    .description {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .slides-container {
      height: 380px;
      border-radius: 1.5rem;
    }

    .slide-content h3 {
      font-size: 1.875rem;
    }

    .slide-content {
      padding: 1.5rem;
    }
  }
</style>
