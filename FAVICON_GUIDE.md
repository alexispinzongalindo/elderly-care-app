# Favicon & Logo Setup Guide

## Current Setup
Your logo is located at: `attached_assets/generated_images/medical_cross_heart_logo.png`

The HTML has been updated to use this logo as a favicon. For best compatibility, you should also create an ICO file.

## How to Convert PNG to ICO

### Option 1: Online Tools (Easiest)
1. **Favicon.io** (Recommended)
   - Go to: https://favicon.io/favicon-converter/
   - Upload your `medical_cross_heart_logo.png`
   - Download the generated `favicon.ico`
   - Place it in your project root directory

2. **Convertio**
   - Go to: https://convertio.co/png-ico/
   - Upload your PNG
   - Download the ICO file

3. **RealFaviconGenerator** (Best for multiple sizes)
   - Go to: https://realfavicongenerator.net/
   - Upload your logo
   - Configure for different devices
   - Download the package (includes ICO, PNG, and HTML code)

### Option 2: Mac Apps
1. **Image2icon** (Free Mac App)
   - Download from: https://www.img2icnsapp.com/
   - Drag your PNG into the app
   - Export as ICO

2. **Icon Composer** (Xcode - if you have it installed)
   - Part of Xcode development tools

### Option 3: Command Line (if you have ImageMagick)
```bash
# Install ImageMagick first: brew install imagemagick
convert attached_assets/generated_images/medical_cross_heart_logo.png -resize 32x32 favicon.ico
```

## Recommended Sizes
- **favicon.ico**: 16x16, 32x32, 48x48 (multi-size ICO)
- **PNG favicon**: 32x32 or 64x64 pixels
- **Apple Touch Icon**: 180x180 pixels (for iOS home screen)

## After Creating favicon.ico

1. Place `favicon.ico` in your project root directory (same folder as `index.html`)

2. Uncomment this line in `index.html` (around line 16):
   ```html
   <link rel="icon" type="image/x-icon" href="favicon.ico">
   ```

3. The HTML already includes:
   - PNG favicon (for modern browsers)
   - Apple Touch Icon (for iOS devices)
   - ICO favicon (when you add it)

## Testing Your Favicon

1. **Hard refresh your browser**: `Cmd + Shift + R`
2. **Check the browser tab** - you should see your logo
3. **Clear browser cache** if it doesn't appear immediately

## Best Practices

1. **Keep it simple**: Favicons are small (16x16 or 32x32), so use simple, recognizable designs
2. **High contrast**: Make sure your logo is visible on both light and dark backgrounds
3. **Square format**: Favicons work best as squares (you may need to crop your logo)
4. **Multiple formats**: Modern browsers support PNG, but ICO is still recommended for older browsers

## Current Logo Location
- **Logo file**: `attached_assets/generated_images/medical_cross_heart_logo.png`
- **Used in**: Navigation bar (top left of the app)

## Need to Change the Logo?

If you want to use a different logo:
1. Replace the PNG file at `attached_assets/generated_images/medical_cross_heart_logo.png`
2. Create a new favicon.ico from your new logo
3. Update the favicon links in `index.html` if you change the file location




