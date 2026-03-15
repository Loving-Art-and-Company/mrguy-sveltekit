<script lang="ts">
  import { SERVICE_CITIES } from '$lib/data/cities';
  import { BUSINESS_INFO } from '$lib/data/services';
  import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-svelte';
  import { track } from '$lib/analytics';

  const socialLinks = [
    { label: 'Instagram', href: BUSINESS_INFO.socialMedia.instagram, platform: 'instagram' },
    { label: 'TikTok', href: BUSINESS_INFO.socialMedia.tiktok, platform: 'tiktok' },
    { label: 'YouTube', href: BUSINESS_INFO.socialMedia.youtube, platform: 'youtube' },
  ] as const;
</script>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-grid">
      <!-- Brand -->
      <div class="footer-section">
        <a href="/" class="footer-logo">
          <img src="/logo/mrguylogo-full-square.png" alt="Mr. Guy Detail Logo" class="footer-logo-img" />
          <span class="footer-logo-text">{BUSINESS_INFO.name}</span>
        </a>
        <p class="footer-tagline">{BUSINESS_INFO.subTagline}</p>
        <div class="footer-socials">
          <p class="footer-social-heading">Follow Mr. Guy</p>
          <div class="footer-social-links">
            {#each socialLinks as social}
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                class="footer-social-link"
                aria-label={`Follow Mr. Guy on ${social.label}`}
                onclick={() =>
                  track('cta_clicked', {
                    cta_type: 'social',
                    location: 'footer',
                    platform: social.platform,
                  })}
              >
                {social.label}
              </a>
            {/each}
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="footer-section">
        <h4>Contact</h4>
        <ul class="footer-list">
          <li>
            <Phone size={14} />
            <a href="tel:+19548044747" onclick={() => track('cta_clicked', { cta_type: 'phone_call', location: 'footer' })}>
              954-804-4747
            </a>
          </li>
          <li>
            <Mail size={14} />
            <a href="mailto:info@mrguymobiledetail.com" onclick={() => track('cta_clicked', { cta_type: 'email', location: 'footer' })}>
              info@mrguymobiledetail.com
            </a>
          </li>
          <li>
            <Clock size={14} />
            <span>{BUSINESS_INFO.hours}</span>
          </li>
        </ul>
      </div>

      <!-- Service Area -->
      <div class="footer-section">
        <h4>Service Area</h4>
        <ul class="footer-list cities">
          {#each SERVICE_CITIES as city}
            <li>
              <MapPin size={14} />
              <a
                href={`/cities/${city.slug}`}
                onclick={() => track('cta_clicked', { cta_type: 'service_area', location: 'footer', city: city.slug })}
              >
                {city.name}, FL
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Quick Links -->
      <div class="footer-section">
        <h4>Quick Links</h4>
        <ul class="footer-list">
          <li><a href="/#services" onclick={() => track('cta_clicked', { cta_type: 'book_now', location: 'footer' })}>Book a Detail</a></li>
          <li><a href="/reschedule" onclick={() => track('cta_clicked', { cta_type: 'my_booking', location: 'footer' })}>My Booking</a></li>
        </ul>
      </div>

      <!-- Social -->
      <div class="footer-section">
        <h4>Follow & Review</h4>
        <ul class="footer-list">
          {#each BUSINESS_INFO.socialLinks as link}
            <li>
              <ExternalLink size={14} />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onclick={() => track('cta_clicked', { cta_type: 'social_link', location: 'footer', platform: link.id })}
              >
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved.</p>
      <p class="footer-phone">
        <Phone size={12} />
        <a href="tel:+19548044747" onclick={() => track('cta_clicked', { cta_type: 'phone_call', location: 'footer_bottom' })}>
          +1 (954) 804-4747
        </a>
      </p>
      <p class="footer-location">
        <MapPin size={12} />
        Serving {BUSINESS_INFO.location}
      </p>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: var(--text-primary);
    color: var(--text-inverse);
    padding: 3rem 1rem 1.5rem;
    margin-top: 2rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-section h4 {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 1rem 0;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    margin-bottom: 0.5rem;
  }

  .footer-logo-img {
    height: 36px;
    width: 36px;
    object-fit: contain;
    border-radius: 6px;
  }

  .footer-logo-text {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-inverse);
  }

  .footer-tagline {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.5;
  }

  .footer-socials {
    margin-top: 1rem;
  }

  .footer-social-heading {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 0.5rem 0;
  }

  .footer-social-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .footer-social-link {
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
    text-decoration: none;
    transition:
      background-color 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  .footer-social-link:hover {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--text-primary);
  }

  .footer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .footer-list li :global(svg) {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .footer-list a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-list a:hover {
    color: var(--color-primary);
  }

  .footer-list.cities {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .footer-bottom p {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  .footer-phone {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .footer-phone :global(svg) {
    color: rgba(255, 255, 255, 0.4);
  }

  .footer-phone a {
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-phone a:hover {
    color: var(--color-primary);
  }

  .footer-location {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .footer-location :global(svg) {
    color: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 640px) {
    .footer-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .footer-list.cities {
      grid-template-columns: 1fr 1fr;
    }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
