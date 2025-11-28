# Cache Configuration Setup Guide

This guide explains how to set up proper cache headers for your website to improve performance and reduce bandwidth costs.

## Files Created

1. **`.htaccess`** - For Apache servers
2. **`_headers`** - For Netlify/Vercel hosting

## Cache Settings

### Images (WebP, PNG, JPG, SVG, ICO)
- **Cache Duration:** 1 year (31,536,000 seconds)
- **Header:** `Cache-Control: public, max-age=31536000, immutable`
- **Why:** Images rarely change, so long cache times improve performance

### CSS & JavaScript
- **Cache Duration:** 1 month (2,592,000 seconds)
- **Header:** `Cache-Control: public, max-age=2592000`
- **Why:** Styles and scripts may be updated more frequently

### Fonts (WOFF2, WOFF, TTF, OTF)
- **Cache Duration:** 1 year (31,536,000 seconds)
- **Header:** `Cache-Control: public, max-age=31536000, immutable`
- **Why:** Fonts are static assets that don't change

## Setup Instructions

### For Apache Servers (cPanel, shared hosting, etc.)

1. Upload `.htaccess` file to your website root directory
2. Ensure `mod_expires` and `mod_headers` are enabled on your server
3. Test by checking response headers:
   ```bash
   curl -I https://denalitechs.com/Video/logo.webp
   ```
   Look for: `Cache-Control: public, max-age=31536000, immutable`

### For Netlify

1. Upload `_headers` file to your website root directory (same level as `index.html`)
2. Deploy your site
3. Netlify will automatically apply these headers
4. Verify in Netlify dashboard → Site settings → Headers

### For Vercel

1. Upload `_headers` file to your `public` directory (or root)
2. Or create `vercel.json`:
   ```json
   {
     "headers": [
       {
         "source": "/Video/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

### For Other Hosting Providers

Check your hosting provider's documentation for:
- How to set cache headers
- Whether they support `.htaccess` files
- Custom header configuration options

## Expected Results

After setup, your images should show:
- **Cache TTL:** 1 year (instead of 10 minutes)
- **Transfer Size:** Reduced on repeat visits (images served from browser cache)
- **PageSpeed Score:** Improved "Efficient cache lifetimes" metric

## Testing

After deploying, test cache headers:

```bash
# Test image cache
curl -I https://denalitechs.com/Video/logo.webp | grep -i cache

# Should show:
# Cache-Control: public, max-age=31536000, immutable
```

Or use browser DevTools:
1. Open Network tab
2. Reload page
3. Click on an image file
4. Check "Response Headers" → Look for `Cache-Control`

## Troubleshooting

**If cache headers aren't working:**

1. **Apache:** Check if `mod_expires` and `mod_headers` are enabled
   ```bash
   apache2ctl -M | grep expires
   apache2ctl -M | grep headers
   ```

2. **Netlify:** Ensure `_headers` file is in root directory, not a subdirectory

3. **Check server logs** for any errors related to cache configuration

4. **Clear CDN cache** if using Cloudflare or similar service

## Notes

- The `immutable` directive tells browsers the file will never change
- After updating images, you may need to change the filename or add version query strings (`?v=2`) to force browsers to fetch new versions
- HTML files have shorter cache (1 hour) to allow for content updates

