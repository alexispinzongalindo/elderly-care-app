# Domain Troubleshooting Guide / Guía de Solución de Problemas del Dominio

## Problem: Nothing Loading After Connecting Domain / Problema: Nada Carga Después de Conectar el Dominio

If you connected a custom domain and nothing is working (no console logs, no network requests), follow these steps:

### Step 1: Verify Domain is Working / Verificar que el Dominio Funciona

1. **Test the health endpoint:**
   - Open: `https://yourdomain.com/health`
   - Should return: `{"status":"ok","message":"Server is running"}`
   - If this doesn't work, the domain DNS isn't configured correctly

2. **Test the root URL:**
   - Open: `https://yourdomain.com/`
   - Should show the login page
   - If you see a blank page or error, there's a routing issue

### Step 2: Check DNS Configuration / Verificar Configuración DNS

1. **In Render.com Dashboard:**
   - Go to your service
   - Click on "Settings" → "Custom Domains"
   - Verify your domain is listed and shows "Verified"
   - Check the DNS records shown

2. **In Your Domain Provider (Namecheap, etc.):**
   - Verify A record or CNAME points to Render
   - For Render, you typically need:
     - **A Record**: Point to Render's IP (check Render dashboard)
     - **CNAME**: Point to `your-service.onrender.com`
   - Wait 24-48 hours for DNS propagation

### Step 3: Check Browser Console / Verificar Consola del Navegador

1. **Open Developer Tools** (F12 or Cmd+Option+I)
2. **Check Console Tab:**
   - You should see: `📄 index.html loaded`
   - You should see: `🌐 Current URL: https://yourdomain.com/`
   - If you see nothing, the HTML file isn't loading

3. **Check Network Tab:**
   - Look for requests to:
     - `index.html` - Should return 200
     - `script.js` - Should return 200
     - `style.css` - Should return 200
     - `/health` - Should return 200
   - If any return 404 or fail, there's a routing issue

### Step 4: Common Issues / Problemas Comunes

#### Issue 1: DNS Not Propagated / DNS No Propagado
**Symptoms:** Domain shows "Not Secure" or doesn't load
**Solution:** Wait 24-48 hours for DNS propagation, or check DNS records

#### Issue 2: SSL Certificate Not Ready / Certificado SSL No Listo
**Symptoms:** Browser shows security warning
**Solution:** Render automatically provisions SSL. Wait a few minutes after adding domain

#### Issue 3: Wrong Domain Configuration / Configuración Incorrecta del Dominio
**Symptoms:** 404 errors or wrong page
**Solution:** 
- Verify domain in Render dashboard
- Check that domain points to correct service
- Ensure service is running

#### Issue 4: CORS Issues / Problemas de CORS
**Symptoms:** Network requests fail with CORS errors
**Solution:** Already configured in server.py with `CORS(app)`, but verify it's working

### Step 5: Quick Tests / Pruebas Rápidas

1. **Test Health Endpoint:**
   ```bash
   curl https://yourdomain.com/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

2. **Test Root:**
   ```bash
   curl https://yourdomain.com/
   ```
   Should return HTML content

3. **Test Static File:**
   ```bash
   curl https://yourdomain.com/script.js
   ```
   Should return JavaScript content

### Step 6: If Still Not Working / Si Todavía No Funciona

1. **Check Render Logs:**
   - Go to Render dashboard
   - Click on your service
   - Check "Logs" tab for errors

2. **Verify Service is Running:**
   - In Render dashboard, service should show "Live"
   - If it shows "Failed" or "Stopped", restart it

3. **Check Build Status:**
   - Ensure latest deployment succeeded
   - Check for build errors

4. **Try IP Address:**
   - If IP was working before, try accessing via IP again
   - This confirms the issue is domain-specific

### Step 7: Rollback if Needed / Retroceder si es Necesario

If domain isn't working and you need to use the app:

1. **Use Render URL:**
   - Access via: `https://your-service.onrender.com`
   - This should always work

2. **Fix Domain Later:**
   - Keep using Render URL while fixing domain
   - Domain issues don't affect the Render URL

## Quick Checklist / Lista de Verificación Rápida

- [ ] Domain shows as "Verified" in Render dashboard
- [ ] DNS records are correct in domain provider
- [ ] SSL certificate is active (green lock in browser)
- [ ] `/health` endpoint returns OK
- [ ] Root URL (`/`) loads the login page
- [ ] Browser console shows `📄 index.html loaded`
- [ ] Network tab shows successful requests
- [ ] Service shows "Live" in Render dashboard

## Still Having Issues? / ¿Todavía Tienes Problemas?

1. Check Render documentation: https://render.com/docs/custom-domains
2. Verify DNS with: https://dnschecker.org
3. Check Render service logs for errors
4. Try accessing via Render URL to confirm service is working

