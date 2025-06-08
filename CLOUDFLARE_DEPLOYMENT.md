# Cloudflare Pages Deployment Guide

## Overview
This PDF Editor application is now fully compatible with Cloudflare Pages static hosting and will work perfectly on your custom domain.

## Quick Deployment Steps

### 1. Connect to Cloudflare Pages
1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project" → "Connect to Git"
3. Select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` (leave empty)

### 2. Environment Variables
No environment variables required for static deployment.

### 3. Custom Domain Setup
1. In Cloudflare Pages project → Custom domains
2. Add your domain: `yourdomain.com`
3. Add www subdomain: `www.yourdomain.com`
4. DNS will auto-configure

## Features Available on Static Deployment

✅ **Full PDF Editing Suite**
- Upload and view PDF files
- Add draggable/resizable text boxes
- Annotation tools (highlight, rectangle, circle)
- Whiteout tool for covering content
- OCR text extraction
- PDF merge and split
- Export modified PDFs

✅ **Client-Side Processing**
- All PDF processing happens in browser
- No server required
- Works offline after initial load
- Fast performance with Web Workers

✅ **Data Storage**
- Browser localStorage for preferences
- File System API for local saves
- No external database needed

## Build Configuration

The project includes Cloudflare-specific files:
- `_headers` - Security headers and caching
- `_redirects` - SPA routing support
- `cloudflare-pages.config.js` - Build configuration

## Performance Optimizations

- PDF.js Web Workers for background processing
- Lazy loading of heavy components
- Optimized bundle splitting
- CDN delivery via Cloudflare

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## File Size Limits

- PDF upload: ~100MB (browser memory limit)
- Export size: Limited by browser capabilities
- Optimal performance with PDFs under 50MB

## Deployment Verification

After deployment, test these features:
1. Upload a PDF file
2. Add text boxes and annotations
3. Use whiteout tool
4. Export modified PDF
5. Verify all tools work correctly

Your PDF editor will be fully functional at your custom domain with enterprise-grade Cloudflare security and performance.