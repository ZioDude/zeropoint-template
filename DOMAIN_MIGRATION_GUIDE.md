# 🔄 Domain Migration Guide: Moving Sites Between Projects

A comprehensive guide for migrating domains between different projects on your VPS, maintaining SSL certificates and ensuring zero downtime.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Removing Domain from Current Project](#removing-domain-from-current-project)
4. [Setting Up New Project](#setting-up-new-project)
5. [Adding Domain to New Project](#adding-domain-to-new-project)
6. [Testing and Verification](#testing-and-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Best Practices](#best-practices)

---

## 🎯 Overview

### Migration Scenario
**Current Setup**: `gprealty-cy.com` hosted in `/var/www/zeropoint-labs` multi-site project
**Target Setup**: `gprealty-cy.com` moved to its own dedicated project directory

### What This Guide Covers
- Safe removal of domain from multi-site setup
- SSL certificate preservation and migration
- Creation of new standalone project
- Zero-downtime migration process
- Testing and rollback procedures

### Migration Benefits
- **Isolated deployment** for better resource management
- **Independent scaling** based on site requirements
- **Separate development cycles** and release schedules
- **Dedicated configurations** optimized for specific needs

---

## ✅ Pre-Migration Checklist

### 1. Backup Current Setup
```bash
# Create backup directory with timestamp
BACKUP_DIR="/backup/migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup current multi-site project
cp -r /var/www/zeropoint-labs $BACKUP_DIR/zeropoint-labs-backup

# Backup SSL certificates
cp -r /var/www/zeropoint-labs/certbot/conf/live/gprealty-cy.com $BACKUP_DIR/ssl-backup/

# Document current configuration
docker ps > $BACKUP_DIR/containers-before.txt
docker exec multi-site-nginx nginx -T > $BACKUP_DIR/nginx-config-before.txt

echo "✅ Backup completed: $BACKUP_DIR"
```

### 2. Verify Current Status
```bash
# Check current setup
cd /var/www/zeropoint-labs

# Verify containers are running
docker ps | grep -E "(gprealty|zeropoint)"

# Test current site accessibility
curl -I https://gprealty-cy.com
curl -I https://zeropoint-labs.com

# Check SSL certificate status
docker exec multi-site-certbot certbot certificates | grep gprealty-cy.com
```

### 3. Plan New Project Structure
```bash
# Create new project directory
sudo mkdir -p /var/www/gprealty-cyprus

# Set proper permissions
sudo chown $USER:$USER /var/www/gprealty-cyprus
```

---

## 🗑️ Removing Domain from Current Project

### Step 1: Stop Services for the Domain

```bash
cd /var/www/zeropoint-labs

# Stop the specific container
docker stop gprealty-cyprus-app

# Verify it's stopped
docker ps | grep gprealty
```

### Step 2: Remove Nginx Configuration

```bash
# Remove from enabled sites
rm -f nginx/sites-enabled/gprealty-cy.com

# Keep the config in sites-available as backup
mv nginx/sites-available/gprealty-cy.com nginx/sites-available/gprealty-cy.com.backup

# Test nginx configuration
docker exec multi-site-nginx nginx -t

# Reload nginx to apply changes
docker exec multi-site-nginx nginx -s reload
```

### Step 3: Remove from Docker Compose

```bash
# Create backup of docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Edit docker-compose.yml to remove gprealty service
# You'll need to remove this section:
# template-app:
#   build: ../simple-template-first copy
#   container_name: gprealty-cyprus-app
#   environment:
#     - NODE_ENV=production
#     - PORT=3001
```

**Create removal script:**
```bash
cat > remove-gprealty-service.sh << 'EOF'
#!/bin/bash

# Create backup
cp docker-compose.yml docker-compose.yml.backup

# Remove the template-app service from docker-compose.yml
sed -i '/template-app:/,/^  [a-z]/{ /^  [a-z]/!d; }' docker-compose.yml
sed -i '/template-app:/d' docker-compose.yml

echo "✅ Removed gprealty service from docker-compose.yml"
echo "🔄 Restart containers to apply changes:"
echo "   docker-compose up -d"
EOF

chmod +x remove-gprealty-service.sh
./remove-gprealty-service.sh
```

### Step 4: Preserve SSL Certificate

```bash
# Copy SSL certificate to safe location
mkdir -p /var/www/ssl-backup/gprealty-cy.com
cp -r certbot/conf/live/gprealty-cy.com/* /var/www/ssl-backup/gprealty-cy.com/
cp -r certbot/conf/archive/gprealty-cy.com /var/www/ssl-backup/
cp certbot/conf/renewal/gprealty-cy.com.conf /var/www/ssl-backup/

echo "✅ SSL certificate backed up to /var/www/ssl-backup/"
```

### Step 5: Clean Up Container and Images

```bash
# Remove container
docker rm gprealty-cyprus-app

# Remove image (optional, saves disk space)
docker image rm zeropoint-labs-template-app 2>/dev/null || true

# Clean up unused volumes and networks
docker system prune -f
```

### Step 6: Update Multi-Site Project

```bash
# Restart remaining services
docker-compose up -d

# Verify zeropoint-labs still works
curl -I https://zeropoint-labs.com

# Check container status
docker ps
```

---

## 🏗️ Setting Up New Project

### Step 1: Create Project Structure

```bash
# Navigate to new project directory
cd /var/www/gprealty-cyprus

# Create project structure
mkdir -p {nginx/{sites-available,sites-enabled,conf.d},certbot/{conf,www},src,docs}

# Create basic directory structure
tree . # If tree is installed
```

### Step 2: Copy Source Code

```bash
# Option A: Copy from existing source
cp -r /var/www/zeropoint-labs/simple-template-first/* /var/www/gprealty-cyprus/src/

# Option B: Clone from repository (if you have one)
# git clone https://github.com/yourusername/gprealty-cyprus.git src

# Option C: Copy from backup
# cp -r $BACKUP_DIR/source-code/* /var/www/gprealty-cyprus/src/

# Ensure proper ownership
sudo chown -R $USER:$USER /var/www/gprealty-cyprus
```

### Step 3: Create Docker Configuration

```bash
# Create docker-compose.yml for standalone project
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  gprealty-app:
    build:
      context: ./src
      dockerfile: Dockerfile
    container_name: gprealty-cyprus-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: gprealty-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/sites-available:ro
      - ./nginx/sites-enabled:/etc/nginx/sites-enabled:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - gprealty-app
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    container_name: gprealty-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: sleep infinity

networks:
  app-network:
    driver: bridge

volumes:
  ssl-certs:
EOF
```

### Step 4: Create Nginx Configuration

```bash
# Create main nginx.conf
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Include site configurations
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create site-specific configuration
cat > nginx/sites-available/gprealty-cy.com << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name gprealty-cy.com www.gprealty-cy.com;
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
    server_name gprealty-cy.com www.gprealty-cy.com;
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

    # Main application
    location / {
        proxy_pass http://gprealty-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://gprealty-app:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

---

## ➕ Adding Domain to New Project

### Step 1: Restore SSL Certificate

```bash
cd /var/www/gprealty-cyprus

# Create SSL directories
mkdir -p certbot/conf/{live,archive,renewal}

# Copy preserved SSL certificate
cp -r /var/www/ssl-backup/gprealty-cy.com certbot/conf/live/
cp -r /var/www/ssl-backup/gprealty-cy.com certbot/conf/archive/
cp /var/www/ssl-backup/gprealty-cy.com.conf certbot/conf/renewal/

# Fix certificate paths in renewal config
sed -i 's|/var/www/zeropoint-labs/certbot/conf|/var/www/gprealty-cyprus/certbot/conf|g' certbot/conf/renewal/gprealty-cy.com.conf

echo "✅ SSL certificate restored"
```

### Step 2: Enable Site Configuration

```bash
# Enable the site
ln -sf /etc/nginx/sites-available/gprealty-cy.com nginx/sites-enabled/gprealty-cy.com

# Verify nginx configuration
docker run --rm -v "$PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
    -v "$PWD/nginx/sites-enabled:/etc/nginx/sites-enabled:ro" \
    nginx:alpine nginx -t
```

### Step 3: Deploy New Project

```bash
# Build and start services
docker-compose build
docker-compose up -d

# Check container status
docker ps

# Verify logs
docker logs gprealty-cyprus-app
docker logs gprealty-nginx
```

### Step 4: Update DNS (if needed)

```bash
# Verify DNS still points to your VPS
nslookup gprealty-cy.com
dig gprealty-cy.com

# If DNS needs updating:
# - Update A record to point to 147.93.95.195
# - Wait for propagation (usually 5-15 minutes)
```

---

## 🧪 Testing and Verification

### Step 1: Basic Connectivity Tests

```bash
# Test HTTP redirect
curl -I http://gprealty-cy.com

# Test HTTPS
curl -I https://gprealty-cy.com

# Test with www
curl -I https://www.gprealty-cy.com

# Verify SSL certificate
openssl s_client -connect gprealty-cy.com:443 -servername gprealty-cy.com < /dev/null | grep -E "(subject|issuer)"
```

### Step 2: Performance and Security Tests

```bash
# Test response time
time curl -s -o /dev/null https://gprealty-cy.com

# Check security headers
curl -I https://gprealty-cy.com | grep -E "(Strict-Transport|X-Content|X-Frame|X-XSS)"

# Test gzip compression
curl -H "Accept-Encoding: gzip" -I https://gprealty-cy.com | grep "Content-Encoding"
```

### Step 3: Application Functionality Tests

```bash
# Test main pages (adjust based on your site structure)
curl -s https://gprealty-cy.com | grep "<title>"
curl -s https://gprealty-cy.com/about | head -20
curl -s https://gprealty-cy.com/properties | head -20

# Test static assets
curl -I https://gprealty-cy.com/favicon.ico
curl -I https://gprealty-cy.com/_next/static/css/app.css 2>/dev/null || echo "CSS path may vary"
```

### Step 4: Verify Multi-Site Setup Still Works

```bash
# Ensure zeropoint-labs still works
cd /var/www/zeropoint-labs
docker ps | grep zeropoint
curl -I https://zeropoint-labs.com

# Check that ports don't conflict
netstat -tlnp | grep -E ":80|:443"
```

---

## 🔄 Rollback Procedures

### Quick Rollback (if issues occur)

```bash
# 1. Stop new project
cd /var/www/gprealty-cyprus
docker-compose down

# 2. Restore to multi-site setup
cd /var/www/zeropoint-labs

# Restore docker-compose.yml
cp docker-compose.yml.backup docker-compose.yml

# Restore nginx config
cp nginx/sites-available/gprealty-cy.com.backup nginx/sites-available/gprealty-cy.com
ln -sf /etc/nginx/sites-available/gprealty-cy.com nginx/sites-enabled/gprealty-cy.com

# Restore SSL certificate
cp -r /var/www/ssl-backup/gprealty-cy.com/* certbot/conf/live/gprealty-cy.com/

# Restart services
docker-compose up -d

echo "✅ Rollback completed"
```

### Full System Restore

```bash
# If complete rollback needed
BACKUP_DIR="/backup/migration-YYYYMMDD-HHMMSS"  # Use your backup directory

# Stop all services
cd /var/www/gprealty-cyprus && docker-compose down
cd /var/www/zeropoint-labs && docker-compose down

# Restore from backup
rm -rf /var/www/zeropoint-labs
cp -r $BACKUP_DIR/zeropoint-labs-backup /var/www/zeropoint-labs

# Remove new project
rm -rf /var/www/gprealty-cyprus

# Restart original setup
cd /var/www/zeropoint-labs
docker-compose up -d

echo "✅ Full system restored from backup"
```

---

## ✅ Best Practices

### 1. Migration Planning

**Before Migration:**
- [ ] Create comprehensive backups
- [ ] Document current configurations
- [ ] Plan migration during low-traffic hours
- [ ] Prepare rollback procedures
- [ ] Test in staging environment if possible

**During Migration:**
- [ ] Follow steps sequentially
- [ ] Verify each step before proceeding
- [ ] Monitor logs for errors
- [ ] Test functionality after each major step

**After Migration:**
- [ ] Comprehensive testing of both old and new setups
- [ ] Monitor performance and logs
- [ ] Update documentation
- [ ] Clean up temporary files

### 2. SSL Certificate Management

```bash
# Set up automatic renewal for new project
cat > /var/www/gprealty-cyprus/renew-ssl.sh << 'EOF'
#!/bin/bash
cd /var/www/gprealty-cyprus
docker-compose exec certbot certbot renew --quiet
docker-compose exec nginx nginx -s reload
EOF

chmod +x /var/www/gprealty-cyprus/renew-ssl.sh

# Add to crontab for automatic renewal
echo "0 3 * * 1 /var/www/gprealty-cyprus/renew-ssl.sh" | crontab -
```

### 3. Monitoring Setup

```bash
# Create monitoring script for new project
cat > /var/www/gprealty-cyprus/monitor.sh << 'EOF'
#!/bin/bash

echo "=== GP Realty Cyprus Status ==="
echo "Containers:"
docker ps --filter "name=gprealty" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\nSSL Certificate:"
docker exec gprealty-certbot certbot certificates 2>/dev/null | grep gprealty-cy.com || echo "Certificate check failed"

echo -e "\nSite Response:"
curl -s -w "HTTP: %{http_code} | Time: %{time_total}s\n" -o /dev/null https://gprealty-cy.com

echo -e "\nDisk Usage:"
df -h /var/www/gprealty-cyprus
EOF

chmod +x /var/www/gprealty-cyprus/monitor.sh
```

### 4. Documentation Updates

After successful migration:

1. **Update main documentation** to reflect new architecture
2. **Document new project structure** in project README
3. **Update backup procedures** to include both projects
4. **Create separate maintenance guides** for each project

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup current setup completely
- [ ] Verify current functionality
- [ ] Create new project directory structure
- [ ] Plan DNS changes (if needed)

### Domain Removal
- [ ] Stop domain-specific container
- [ ] Remove nginx configuration
- [ ] Update docker-compose.yml
- [ ] Preserve SSL certificate
- [ ] Clean up unused resources

### New Project Setup
- [ ] Copy source code to new location
- [ ] Create Docker configuration
- [ ] Set up nginx configuration
- [ ] Restore SSL certificate
- [ ] Enable site configuration

### Testing
- [ ] Basic connectivity (HTTP/HTTPS)
- [ ] SSL certificate validation
- [ ] Application functionality
- [ ] Performance verification
- [ ] Security headers check

### Post-Migration
- [ ] Monitor both projects
- [ ] Update documentation
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups
- [ ] Clean up temporary files

---

## 🎯 Summary

### What This Migration Achieves

**Benefits:**
✅ **Independent deployment** cycles for each project
✅ **Isolated resource management** and scaling
✅ **Separate configuration** optimized for each site
✅ **Reduced complexity** in each project
✅ **Easier maintenance** and troubleshooting

**Architecture Change:**
```
Before: One project hosting multiple domains
After: Separate projects, each with its own domain and infrastructure
```

### Ongoing Maintenance

After migration, you'll maintain:
- **Two separate Docker Compose projects**
- **Independent SSL certificate renewal** for each
- **Separate monitoring and backup procedures**
- **Individual scaling and optimization strategies**

---

**🚀 Your domain migration is now complete with professional, production-ready infrastructure!**

*Keep this guide updated as you perform more migrations and refine the process.* 