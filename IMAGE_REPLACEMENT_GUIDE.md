# Before/After Image Replacement Guide

## Current Issue
The before/after images don't show the same car in dirty vs clean states. They need to be replaced with proper progression shots.

## Images to Replace

Located in: `static/images/before-after/`

### 1. Exterior Wash (Gold Package)
**Files to replace:**
- `exterior-before.webp` (71KB) - Should show: Dirty car exterior
- `exterior-after.webp` (29KB) - Should show: SAME car, clean exterior

**Recommended specs:**
- Same car, same angle
- Before: Dusty/dirty/muddy exterior
- After: Clean, shiny exterior
- Resolution: 800x600px minimum
- Format: WebP (use `magick convert image.jpg -quality 85 image.webp`)

### 2. Interior Detail (Platinum Package)
**Files to replace:**
- `interior-before.webp` (50KB) - Should show: Dirty car interior
- `interior-after.webp` (54KB) - Should show: SAME car interior, clean

**Recommended specs:**
- Same car interior, same angle
- Before: Crumbs, dust, stains on seats/console
- After: Vacuumed, wiped, spotless interior
- Resolution: 800x600px minimum
- Format: WebP

### 3. Headlight Restoration (Add-on/Special Service)
**Files to replace:**
- `headlight-before.webp` (137KB) - Should show: Foggy/yellowed headlight
- `headlight-after.webp` (99KB) - Should show: SAME headlight, crystal clear

**Recommended specs:**
- Same headlight close-up
- Before: Foggy, yellowed, oxidized
- After: Clear, bright, like new
- Resolution: 800x600px minimum
- Format: WebP

## How to Get Images

### Option 1: Free Stock Photos (Recommended)
**Best sources for car detailing before/after:**
1. **Unsplash** - https://unsplash.com/s/photos/car-detailing
2. **Pexels** - https://www.pexels.com/search/car%20wash/
3. **Pixabay** - https://pixabay.com/photos/search/car%20cleaning/

**Search terms to use:**
- "car detailing before after"
- "dirty car cleaning"
- "car wash transformation"
- "headlight restoration"
- "car interior cleaning"

### Option 2: Take Your Own Photos
If you detail a car:
1. Take "before" photo (dirty state)
2. Detail the car
3. Take "after" photo from EXACT same angle
4. Convert to WebP: `magick convert photo.jpg -quality 85 photo.webp`

### Option 3: AI Generation
Use Midjourney/DALL-E with prompts like:
- "Professional car detailing before photo, dirty sedan exterior, realistic photography"
- "Professional car detailing after photo, clean shiny sedan exterior, same car, realistic photography"

### Option 4: Client Photos
If you have permission, use real customer before/after photos from actual detailing jobs.

## How to Replace Images

Once you have the new images:

```bash
cd ~/mrguy-sveltekit/static/images/before-after/

# Backup old images
mkdir old
mv *.webp old/

# Convert new images to WebP (if not already)
magick convert new-exterior-before.jpg -quality 85 exterior-before.webp
magick convert new-exterior-after.jpg -quality 85 exterior-after.webp
magick convert new-interior-before.jpg -quality 85 interior-before.webp
magick convert new-interior-after.jpg -quality 85 interior-after.webp
magick convert new-headlight-before.jpg -quality 85 headlight-before.webp
magick convert new-headlight-after.jpg -quality 85 headlight-after.webp

# Deploy
git add .
git commit -m "Replace before/after images with proper dirty→clean progressions"
vercel --prod --yes
```

## Image Mapping (Current)

From `src/lib/utils/serviceImageMapper.ts`:

```typescript
const serviceImages: ServiceImageMap = {
  'gold': {
    before: '/images/before-after/exterior-before.webp',
    after: '/images/before-after/exterior-after.webp'
  },
  'platinum': {
    before: '/images/before-after/interior-before.webp',
    after: '/images/before-after/interior-after.webp'
  },
  'silver': {
    before: '/images/before-after/exterior-before.webp',
    after: '/images/before-after/exterior-after.webp'
  }
};
```

## Quick Fix (Temporary)

If you need to launch NOW without proper images, you can:

1. **Disable the image toggle** in ServiceCard component
2. **Show text-only service cards** until you get proper images
3. **Use process images** from `/images/process/` as placeholders

To temporarily disable images, edit:
`src/lib/components/booking/ServiceCard.svelte`

Replace the image section with a colored gradient placeholder.

## Priority

**High Priority** - These images are visible in the 3-step booking flow at:
- https://mrguydetail.com/book3

Users will notice if the before/after don't match!

## Timeline

- **Ideal:** Replace before Jan 24 launch (2 days)
- **Acceptable:** Replace within 1 week of launch
- **Maximum:** Replace before heavy marketing push
