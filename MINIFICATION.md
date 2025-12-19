# Code Minification

This project uses minified versions of JavaScript, CSS, and HTML files to reduce deployment size and improve load times.

## File Sizes

**Original Files:**
- `script.js`: 387 KB (8,430 lines)
- `style.css`: 54 KB (2,718 lines)
- `index.html`: 126 KB (1,885 lines)
- **Total**: ~568 KB

**Minified Files:**
- `script.min.js`: 263 KB (32% reduction)
- `style.min.css`: 38 KB (29% reduction)
- `index.min.html`: 75 KB (41% reduction)
- **Total**: ~376 KB

**Overall Reduction**: ~34% smaller, saving ~192 KB

## How It Works

1. **Minification**: The `minify.py` script creates minified versions of all frontend files
2. **Auto-serving**: The Flask server automatically serves minified versions when they exist
3. **Fallback**: If minified files don't exist, original files are served

## Usage

### Generate Minified Files

```bash
# Run the minification script
python3 minify.py

# Or use the build script
./build.sh
```

### Deploy with Minified Files

Minified files are included in the repository, so they're automatically available after deployment.

The server will automatically serve:
- `script.js` → `script.min.js` (if exists)
- `style.css` → `style.min.css` (if exists)

### Disable Minified Files (for debugging)

Set environment variable:
```bash
USE_MINIFIED=false
```

## Build Script

The `build.sh` script runs minification and prepares files for deployment:

```bash
./build.sh
```

## Deployment Integration

For Render or other platforms, you can add a build command to regenerate minified files:

```bash
python3 minify.py
```

Or set it as a pre-deploy hook in your deployment configuration.

## Technical Details

The minification process:
- **JavaScript**: Removes comments, whitespace, and optimizes spacing
- **CSS**: Removes comments and unnecessary whitespace
- **HTML**: Removes comments and compresses whitespace (preserves functionality)

**Note**: The minification is conservative and preserves all functionality. It's safe to use in production.

