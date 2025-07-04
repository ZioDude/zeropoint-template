# 🚀 GP.Realty Cyprus - VPS Deployment Guide

## 📋 Quick Deployment

This project is configured for **standalone deployment** to `gprealty-cy.com` using Docker and nginx.

### 🔧 Prerequisites

- VPS with Docker and Docker Compose installed
- Domain `gprealty-cy.com` pointing to your VPS IP address
- SSH access to your VPS

### ⚡ One-Command Deployment

```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

## 📁 Project Structure

```
gprealty-nextjs/
├── docker-compose.yml          # Main orchestration
├── Dockerfile                  # Next.js app container
├── deploy.sh                   # Automated deployment script
├── nginx/
│   ├── nginx.conf             # Main nginx config
│   ├── sites-available/       # Site configurations
│   └── sites-enabled/         # Enabled sites (symlinks)
├── next.config.ts             # Next.js production config
└── .dockerignore              # Optimized build context
```

## 🐳 Services

### **Application Stack:**
- **gprealty-app**: Next.js application (port 3001)
- **nginx**: Reverse proxy with SSL (ports 80/443)
- **certbot**: SSL certificate management

### **Network:**
- Internal docker network for service communication
- Only ports 80 and 443 exposed externally

## 🌐 Domain Configuration

### **Target Domain:** `gprealty-cy.com`
- **HTTP** → Redirects to HTTPS
- **HTTPS** → Serves the application
- **SSL** → Let's Encrypt automatic certificates

### **DNS Requirements:**
```
A Record: gprealty-cy.com → [YOUR-VPS-IP]
```

## 🔒 SSL Setup

The deployment script handles SSL automatically:

1. **Manual SSL** (during deployment):
   ```bash
   # The script will ask if domain is pointing to server
   # Answer 'y' when ready for SSL setup
   ```

2. **SSL Renewal** (automatic):
   ```bash
   # Add to crontab for auto-renewal
   0 12 * * * /usr/bin/docker-compose -f /path/to/docker-compose.yml run --rm certbot renew --quiet
   ```

## 📊 Management Commands

### **Service Control:**
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose down && docker-compose up -d --build
```

### **Monitoring:**
```bash
# View all logs
docker-compose logs -f

# View app logs only
docker-compose logs -f gprealty-app

# View nginx logs
docker-compose logs -f nginx

# Check service status
docker-compose ps
```

### **Debugging:**
```bash
# Enter app container
docker-compose exec gprealty-app sh

# Enter nginx container
docker-compose exec nginx sh

# Check nginx config
docker-compose exec nginx nginx -t
```

## 🔧 Configuration Updates

### **Environment Variables:**
Create `.env` file if needed:
```env
NODE_ENV=production
PORT=3001
NEXT_TELEMETRY_DISABLED=1
```

### **Domain Changes:**
1. Update `nginx/sites-available/gprealty-cy.com`
2. Update `deploy.sh` DOMAIN variable
3. Restart services

### **Port Changes:**
1. Update `docker-compose.yml` expose section
2. Update nginx proxy_pass target
3. Rebuild containers

## 🚨 Troubleshooting

### **Common Issues:**

1. **Service won't start:**
   ```bash
   docker-compose logs gprealty-app
   # Check for dependency or build errors
   ```

2. **SSL certificate issues:**
   ```bash
   # Remove existing certificates and retry
   sudo rm -rf ./certbot/conf/live/gprealty-cy.com
   ./deploy.sh
   ```

3. **Nginx config errors:**
   ```bash
   docker-compose exec nginx nginx -t
   # Fix syntax errors in nginx configs
   ```

4. **Port conflicts:**
   ```bash
   # Check what's using ports 80/443
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

### **Performance Optimization:**

1. **Enable gzip** ✅ (already configured)
2. **Static file caching** ✅ (already configured)
3. **Image optimization** ✅ (Next.js built-in)
4. **Standalone output** ✅ (Docker optimized)

## 📈 Production Checklist

- [ ] Domain DNS pointing to VPS
- [ ] Firewall allowing ports 80/443
- [ ] SSL certificate installed
- [ ] Services running and accessible
- [ ] Nginx config validated
- [ ] Application responding correctly
- [ ] Static assets loading
- [ ] Forms working properly
- [ ] SSL renewal cron job set up

## 🆘 Support

If you encounter issues:

1. Check service logs: `docker-compose logs -f`
2. Verify nginx config: `docker-compose exec nginx nginx -t`
3. Check domain DNS propagation
4. Ensure no port conflicts on VPS
5. Verify SSL certificate status

## 🎯 Quick Commands Reference

```bash
# Deploy from scratch
./deploy.sh

# Quick restart
docker-compose restart

# Update application
git pull && docker-compose up -d --build gprealty-app

# Backup (if needed)
docker-compose exec gprealty-app tar -czf /tmp/backup.tar.gz /app

# View real-time logs
docker-compose logs -f gprealty-app
```

---

**🏠 GP.Realty Cyprus** - Student Housing Platform  
**🌐 Domain:** gprealty-cy.com  
**📱 App Port:** 3001 (internal)  
**🔒 SSL:** Let's Encrypt 