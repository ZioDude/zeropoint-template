# 🔗 Integration Guide: Adding GP.Realty to Existing Multi-Site Setup

## 📋 Overview

This guide helps you add the GP.Realty Next.js application to your **existing multi-site Docker Compose setup** on your VPS.

## 🐳 Docker Service Integration

### **Add to your existing `docker-compose.yml`:**

```yaml
services:
  # ... your existing services ...

  gprealty-app:
    build:
      context: /path/to/gprealty-nextjs  # Update path to this project
      dockerfile: Dockerfile
    container_name: gprealty-cyprus-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    expose:
      - "3001"
    networks:
      - your-existing-network  # Use your existing network name

networks:
  your-existing-network:  # Your existing network
    external: true
```

## 🌐 Nginx Configuration

### **Add to your existing nginx sites:**

**File:** `nginx/sites-available/gprealty-cy.com`

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name gprealty-cy.com;
    server_tokens off;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name gprealty-cy.com;
    server_tokens off;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/gprealty-cy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gprealty-cy.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Main application
    location / {
        proxy_pass http://gprealty-app:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static assets caching for Next.js
    location /_next/static/ {
        proxy_pass http://gprealty-app:3001;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Image optimization
    location /_next/image/ {
        proxy_pass http://gprealty-app:3001;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|mp4)$ {
        proxy_pass http://gprealty-app:3001;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://gprealty-app:3001;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📁 File Structure

### **What you need in your VPS:**

```
/var/www/
├── your-existing-project/           # Your current multi-site setup
│   ├── docker-compose.yml         # ADD gprealty-app service here
│   │   ├── docker-compose.yml         # ADD gprealty-app service here
│   │   └── certbot/                   # Your existing SSL setup
│   └── gprealty-nextjs/               # CLONE this project here
│       ├── Dockerfile                 # ✅ Keep
│       ├── src/                       # ✅ Keep - All your app code
│       ├── package.json               # ✅ Keep
│       ├── next.config.ts            # ✅ Keep
│       └── .dockerignore             # ✅ Keep
```

## 🚀 Deployment Steps

### **1. Clone/Copy Project:**

```bash
# On your VPS
cd /var/www/
git clone https://github.com/ZioDude/zeropoint-template.git gprealty-nextjs
cd gprealty-nextjs
```

### **2. Update Your Existing docker-compose.yml:**

```bash
cd /var/www/your-existing-project

# Backup current config
cp docker-compose.yml docker-compose.yml.backup

# Add the gprealty-app service to your existing file
nano docker-compose.yml
```

**Add this service block:**
```yaml
  gprealty-app:
    build:
      context: ../gprealty-nextjs  # Path to the project
      dockerfile: Dockerfile
    container_name: gprealty-cyprus-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    expose:
      - "3001"
    networks:
      - your-existing-network  # Use your network name
```

### **3. Add Nginx Configuration:**

```bash
# Copy the nginx config to your existing setup
cp ../gprealty-nextjs/nginx/sites-available/gprealty-cy.com nginx/sites-available/

# Enable the site
ln -sf ../sites-available/gprealty-cy.com nginx/sites-enabled/gprealty-cy.com

# Test nginx config
docker-compose exec nginx nginx -t
```

### **4. Get SSL Certificate:**

```bash
# Using your existing certbot setup
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d gprealty-cy.com
```

### **5. Deploy:**

```bash
# Build and start the new service
docker-compose up -d --build gprealty-app

# Reload nginx with new config
docker-compose exec nginx nginx -s reload

# Check status
docker-compose ps
```

## ✅ Verification

### **Test the deployment:**

```bash
# Check container is running
docker ps | grep gprealty

# Test HTTP redirect
curl -I http://gprealty-cy.com

# Test HTTPS
curl -I https://gprealty-cy.com

# Check logs
docker logs gprealty-cyprus-app
```

## 🔧 Maintenance

### **Update application:**
```bash
cd /var/www/gprealty-nextjs
git pull origin main
cd /var/www/your-existing-project
docker-compose up -d --build gprealty-app
```

### **View logs:**
```bash
docker logs -f gprealty-cyprus-app
```

### **Restart service:**
```bash
docker-compose restart gprealty-app
```

## 📋 Integration Checklist

- [ ] Clone project to VPS
- [ ] Add service to existing docker-compose.yml
- [ ] Copy nginx configuration
- [ ] Enable nginx site
- [ ] Get SSL certificate
- [ ] Build and start service
- [ ] Test domain access
- [ ] Verify HTTPS and redirects
- [ ] Check application functionality

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# Stop the new service
docker-compose stop gprealty-app

# Remove from nginx
rm nginx/sites-enabled/gprealty-cy.com

# Restore docker-compose.yml
cp docker-compose.yml.backup docker-compose.yml

# Reload nginx
docker-compose exec nginx nginx -s reload

# Restart services
docker-compose up -d
```

---

**Key Point:** You only need to integrate the **gprealty-app service** into your existing infrastructure, not create a new standalone setup! 