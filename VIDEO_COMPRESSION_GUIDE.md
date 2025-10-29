# Video Compression Guide for Denali Tech Website

## Current Video Sizes
- **Denali tech smart home.mp4**: 82MB ⚠️ (Too Large)
- **wifi.mp4**: 33MB ⚠️ (Too Large)
- **Smart lighting Solutions - Denali Tech.mp4**: 18MB ⚠️ (Should compress)
- **Home theter Systems - Denali Tech - Chicago.mp4**: 14MB ✓ (Acceptable)
- **camera.mp4**: 1.6MB ✓ (Good)
- **shades.mp4**: 1.3MB ✓ (Good)
- **whole hone audio.mp4**: 1.6MB ✓ (Good)

## Recommended Target Sizes
- All videos should be **10-15MB max** for fast mobile loading
- Aim for **5-10MB** if possible without quality loss

## How to Compress Videos

### Option 1: Using HandBrake (Easy - No Command Line)
1. Download **HandBrake** (free): https://handbrake.fr/
2. Open HandBrake and add your video file
3. Settings:
   - **Preset**: "Web" → "Gmail Medium 5 Minutes 720p30"
   - **Video Codec**: H.264
   - **Quality**: RF 24-26 (lower number = better quality)
   - **Framerate**: Same as source
   - **Resolution**: 1280x720 (720p is perfect for website loops)
4. Click "Start Encode"
5. Replace the old file with the new compressed version

### Option 2: Using CloudConvert (Online - No Install)
1. Go to https://cloudconvert.com/mp4-converter
2. Upload your video
3. Set quality to "Medium" or "High"
4. Set video resolution to 1280x720 (720p)
5. Convert and download
6. Replace the old file

### Option 3: Using FFmpeg (Command Line - Most Control)

If you have Homebrew installed, install ffmpeg:
```bash
brew install ffmpeg
```

Then compress videos:

```bash
# Navigate to Video folder
cd "/Users/ashb/Desktop/Denali Tech Website/Video"

# Compress smart home video (82MB → ~10MB)
ffmpeg -i "Denali tech smart home.mp4" -vcodec h264 -crf 28 -preset medium -vf scale=1280:-2 -acodec aac -b:a 128k "Denali tech smart home_compressed.mp4"

# Compress WiFi video (33MB → ~8MB)
ffmpeg -i "wifi.mp4" -vcodec h264 -crf 28 -preset medium -vf scale=1280:-2 -acodec aac -b:a 128k "wifi_compressed.mp4"

# Compress lighting video (18MB → ~6MB)
ffmpeg -i "Smart lighting Solutions - Denali Tech.mp4" -vcodec h264 -crf 28 -preset medium -vf scale=1280:-2 -acodec aac -b:a 128k "Smart lighting Solutions - Denali Tech_compressed.mp4"

# After testing quality, replace old files with compressed versions
mv "Denali tech smart home_compressed.mp4" "Denali tech smart home.mp4"
mv "wifi_compressed.mp4" "wifi.mp4"
mv "Smart lighting Solutions - Denali Tech_compressed.mp4" "Smart lighting Solutions - Denali Tech.mp4"
```

**Explanation of FFmpeg settings:**
- `-crf 28`: Quality level (23-28 is good, lower = better quality)
- `-preset medium`: Encoding speed (slow = smaller file, fast = bigger file)
- `-vf scale=1280:-2`: Resize to 720p (maintains aspect ratio)
- `-acodec aac -b:a 128k`: Audio compression

## After Compression
1. Test all videos on the website to ensure quality is good
2. Check file sizes - should be 5-15MB each
3. Test loading speed on mobile phone
4. Commit and push changes to GitHub

## Current Optimization
✓ Videos already use `preload="metadata"` (loads only first frame until user interaction)
✓ Videos have poster images (logo.JPG shows while loading)
✓ Videos set to autoplay, muted, loop (best for background videos)

## Priority Videos to Compress
1. **Denali tech smart home.mp4** (82MB) - HIGHEST PRIORITY
2. **wifi.mp4** (33MB) - HIGH PRIORITY  
3. **Smart lighting Solutions - Denali Tech.mp4** (18MB) - MEDIUM PRIORITY

Compressing these 3 files will reduce total size from **133MB to ~25MB** - a huge improvement! 🚀

