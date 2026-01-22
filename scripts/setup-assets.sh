#!/bin/bash
# MrGuyDetail Asset Setup Script
# Generates logo variants and favicons from source logo

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MrGuyDetail Asset Setup${NC}"
echo "================================"

# Check if source logo exists
SOURCE_LOGO="/Users/papacreates/dev/company/MRGUYDETAIL/assets/mrguylogo.png"
if [ ! -f "$SOURCE_LOGO" ]; then
  echo "❌ Error: Source logo not found at $SOURCE_LOGO"
  exit 1
fi

# Create directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p static/logo
mkdir -p static/favicons

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null && ! command -v magick &> /dev/null; then
  echo "⚠️  ImageMagick not found. Installing via Homebrew..."
  brew install imagemagick
fi

# Use magick or convert command (different on macOS vs Linux)
if command -v magick &> /dev/null; then
  MAGICK="magick"
else
  MAGICK="convert"
fi

# Generate logo variants
echo -e "${BLUE}🎨 Generating logo variants...${NC}"

# Header logo (240px width, maintain aspect ratio)
$MAGICK "$SOURCE_LOGO" -resize 240x240 -background none -gravity center static/logo/mrguylogo-header.png
echo -e "${GREEN}✓${NC} Header logo created (240x240)"

# Full logo (500px width)
$MAGICK "$SOURCE_LOGO" -resize 500x500 -background none -gravity center static/logo/mrguylogo-full.png
echo -e "${GREEN}✓${NC} Full logo created (500x500)"

# Generate favicons
echo -e "${BLUE}🔷 Generating favicons...${NC}"

# favicon.ico (multi-size ICO file: 16x16, 32x32, 48x48)
$MAGICK "$SOURCE_LOGO" -resize 16x16 -background none -gravity center /tmp/favicon-16.png
$MAGICK "$SOURCE_LOGO" -resize 32x32 -background none -gravity center /tmp/favicon-32.png
$MAGICK "$SOURCE_LOGO" -resize 48x48 -background none -gravity center /tmp/favicon-48.png
$MAGICK /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png static/favicons/favicon.ico
rm /tmp/favicon-16.png /tmp/favicon-32.png /tmp/favicon-48.png
echo -e "${GREEN}✓${NC} favicon.ico created (multi-size)"

# PNG favicons for various uses
$MAGICK "$SOURCE_LOGO" -resize 32x32 -background none -gravity center static/favicons/favicon-32x32.png
echo -e "${GREEN}✓${NC} favicon-32x32.png created"

$MAGICK "$SOURCE_LOGO" -resize 16x16 -background none -gravity center static/favicons/favicon-16x16.png
echo -e "${GREEN}✓${NC} favicon-16x16.png created"

# Apple Touch Icon (180x180, squared with padding)
$MAGICK "$SOURCE_LOGO" -resize 160x160 -background "#0EA5E9" -gravity center -extent 180x180 static/favicons/apple-touch-icon.png
echo -e "${GREEN}✓${NC} apple-touch-icon.png created (180x180)"

# Android Chrome icons
$MAGICK "$SOURCE_LOGO" -resize 192x192 -background none -gravity center static/favicons/android-chrome-192x192.png
echo -e "${GREEN}✓${NC} android-chrome-192x192.png created"

$MAGICK "$SOURCE_LOGO" -resize 512x512 -background none -gravity center static/favicons/android-chrome-512x512.png
echo -e "${GREEN}✓${NC} android-chrome-512x512.png created"

# Create web manifest
echo -e "${BLUE}📄 Creating web manifest...${NC}"
cat > static/favicons/site.webmanifest <<EOF
{
  "name": "Mr. Guy Detail",
  "short_name": "MrGuyDetail",
  "icons": [
    {
      "src": "/favicons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#0EA5E9",
  "background_color": "#F0F9FF",
  "display": "standalone"
}
EOF
echo -e "${GREEN}✓${NC} site.webmanifest created"

# Summary
echo ""
echo -e "${GREEN}✅ Asset setup complete!${NC}"
echo ""
echo "Generated files:"
echo "  📁 static/logo/"
echo "    - mrguylogo-header.png (240x240)"
echo "    - mrguylogo-full.png (500x500)"
echo "  📁 static/favicons/"
echo "    - favicon.ico (multi-size)"
echo "    - favicon-16x16.png"
echo "    - favicon-32x32.png"
echo "    - apple-touch-icon.png (180x180)"
echo "    - android-chrome-192x192.png"
echo "    - android-chrome-512x512.png"
echo "    - site.webmanifest"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Add favicon links to src/app.html or +layout.svelte"
echo "  2. Update Header.svelte to use /logo/mrguylogo-header.png"
echo "  3. Test favicon appears in browser tab"
echo ""
