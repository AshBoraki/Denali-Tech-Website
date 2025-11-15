# WebP Image Conversion Guide

## Overview
WebP is a modern image format that provides superior compression and quality compared to JPEG and PNG. Converting images to WebP can reduce file sizes by 25-35% while maintaining the same visual quality, resulting in faster page loads.

## Benefits
- **Smaller file sizes**: 25-35% smaller than JPEG/PNG
- **Better performance**: Faster page loads, especially on mobile
- **Same quality**: Visually identical to original formats
- **Browser support**: Supported by all modern browsers (95%+)

## Conversion Tools

### Option 1: Online Tools (Easiest)
1. **Squoosh** (Recommended): https://squoosh.app/
   - Drag and drop images
   - Adjust quality slider
   - Download WebP versions
   - Best for: Quick conversions, visual quality control

2. **CloudConvert**: https://cloudconvert.com/jpg-to-webp
   - Batch conversion support
   - API available
   - Best for: Multiple files

### Option 2: Command Line (For Developers)

#### Using cwebp (Google's WebP Tools)
```bash
# Install on macOS
brew install webp

# Convert single image
cwebp -q 80 input.jpg -o output.webp

# Convert all JPG files in Video folder
for file in Video/*.jpg Video/*.JPG; do
    cwebp -q 80 "$file" -o "${file%.*}.webp"
done

# Convert PNG files
for file in Video/*.png; do
    cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

#### Using ImageMagick
```bash
# Install on macOS
brew install imagemagick

# Convert single image
magick convert input.jpg -quality 80 output.webp

# Batch convert
magick mogrify -format webp -quality 80 Video/*.jpg
```

### Option 3: Python Script (Automated)
```python
from PIL import Image
import os

def convert_to_webp(input_path, output_path, quality=80):
    """Convert image to WebP format"""
    image = Image.open(input_path)
    image.save(output_path, 'WEBP', quality=quality)

# Convert all images in Video folder
video_folder = 'Video'
for filename in os.listdir(video_folder):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        input_path = os.path.join(video_folder, filename)
        output_path = os.path.join(video_folder, filename.rsplit('.', 1)[0] + '.webp')
        convert_to_webp(input_path, output_path, quality=80)
        print(f'Converted: {filename}')
```

## Recommended Quality Settings
- **High quality images** (logos, hero images): Quality 85-90
- **Standard images** (photos, project images): Quality 75-85
- **Thumbnails/small images**: Quality 60-75

## Implementation in HTML

### Using `<picture>` Element (Recommended)
This provides fallback for older browsers:

```html
<picture>
    <source srcset="Video/logo.webp" type="image/webp">
    <img src="Video/logo.JPG" alt="Denali Tech Logo" loading="eager">
</picture>
```

### Using Modern Image Loading
```html
<img src="Video/logo.webp" 
     srcset="Video/logo.webp 1x, Video/logo@2x.webp 2x"
     alt="Denali Tech Logo" 
     loading="lazy">
```

## Priority Images to Convert

### High Priority (Above the fold)
1. `Video/logo.JPG` - Logo (used on every page)
2. Hero images on homepage
3. Project showcase header image

### Medium Priority (Visible on scroll)
1. Project gallery images
2. Brand logos
3. Service images

### Low Priority (Below the fold)
1. Footer images
2. Background images
3. Decorative images

## Testing
After conversion:
1. Compare file sizes (should be 25-35% smaller)
2. Visual quality check (should look identical)
3. Test in different browsers
4. Check page load speed (use PageSpeed Insights)

## Browser Support
- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14+, macOS Big Sur+)
- Edge: ✅ Full support
- Older browsers: Will fallback to JPEG/PNG automatically

## Notes
- Keep original files as backup
- Test on actual devices, not just desktop
- Monitor page load times before/after conversion
- Consider using responsive images with `srcset` for different screen sizes

## Quick Start Checklist
- [ ] Install conversion tool (Squoosh or cwebp)
- [ ] Convert logo image first (test quality)
- [ ] Convert hero images
- [ ] Convert project gallery images
- [ ] Update HTML to use WebP with fallbacks
- [ ] Test in multiple browsers
- [ ] Check page load speed improvement
- [ ] Commit changes to git

