# Web3Forms Setup Guide

## Why Web3Forms?

We've switched from FormSubmit.co to Web3Forms because:
- ✅ More reliable and stable service
- ✅ Better error handling and debugging
- ✅ Free tier with 250 submissions/month
- ✅ Built-in spam protection with hCaptcha
- ✅ Better API response format

## Important: hCaptcha Setup Required

Web3Forms requires hCaptcha for spam protection. You have two options:

### Option 1: Disable Captcha in Web3Forms Dashboard (Easiest)
1. Go to [Web3Forms Dashboard](https://web3forms.com)
2. Log in with your email
3. Find your access keys
4. Click on each access key
5. **Disable "Require hCaptcha"** in the settings
6. Save changes

### Option 2: Get hCaptcha Site Key (If you want captcha)
1. Go to [hCaptcha.com](https://www.hcaptcha.com/)
2. Sign up for a free account
3. Create a new site
4. Get your Site Key
5. Replace `10000000-ffff-ffff-ffff-000000000001` in the HTML files with your real site key

## Setup Instructions

### Step 1: Get Your Access Key

1. Go to [https://web3forms.com](https://web3forms.com)
2. Enter your email address: `services@denalitechs.com`
3. Click "Get Your Access Key"
4. Check your email for the access key
5. Copy the access key (it will look like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Step 2: Update the Access Key in Your Website

You need to replace `YOUR_WEB3FORMS_ACCESS_KEY` with your actual access key in these files:

1. **index.html** - Line 2334 (booking form)
2. **index.html** - Line 2429 (newsletter form)  
3. **contact.html** - Line 1569 (consultation form)
4. **contact.html** - Line 1673 (booking form)

**Find and replace:**
```html
<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
```

**With:**
```html
<input type="hidden" name="access_key" value="YOUR_ACTUAL_ACCESS_KEY_HERE">
```

### Step 3: Test the Forms

1. Test the booking form on the homepage
2. Test the consultation form on the contact page
3. Test the newsletter subscription form
4. Check your email (`services@denalitechs.com` and `Hello@denalitechs.com`) for submissions

### Step 4: Verify Everything Works

- ✅ Forms submit without errors
- ✅ Success messages appear
- ✅ Emails are received
- ✅ No console errors in browser (F12 → Console)

## Troubleshooting

### Forms Still Not Working?

1. **Check the access key** - Make sure it's correct and not expired
2. **Check browser console** - Look for error messages (F12 → Console)
3. **Check email** - Make sure emails are going to the correct address
4. **Check Web3Forms dashboard** - Log in to see submission history

### Getting Rate Limit Errors?

- Free tier: 250 submissions/month
- Upgrade to paid plan if you need more
- Or use multiple access keys for different forms

## Support

- Web3Forms Documentation: https://docs.web3forms.com
- Web3Forms Support: https://web3forms.com/contact

---

**Important:** Don't forget to replace `YOUR_WEB3FORMS_ACCESS_KEY` with your actual access key before going live!

