# ☁️ OnStream Cloud Deployment Guide

Complete guide to deploy OnStream to the cloud for global access.

## 🎯 Deployment Options

### 1. 🚀 **Digital Ocean (Recommended)**
**Why:** Best balance of price, performance, and ease of use

**Cost:** $6-12/month for VPS  
**Setup Time:** 15 minutes  
**Scalability:** Excellent  

### 2. 🔥 **Railway**
**Why:** Zero-config deployment, built for modern apps

**Cost:** $5-10/month  
**Setup Time:** 5 minutes  
**Scalability:** Auto-scaling  

### 3. ⚡ **Vercel + PlanetScale**
**Why:** Frontend on Vercel, Database on PlanetScale

**Cost:** Free tier available  
**Setup Time:** 10 minutes  
**Scalability:** Serverless  

### 4. 📦 **Docker + Any VPS**
**Why:** Maximum control and portability

**Cost:** $5-15/month  
**Setup Time:** 20 minutes  
**Scalability:** Manual  

---

## 🚀 Option 1: Digital Ocean Deployment

### Step 1: Create Droplet
```bash
# Create account at digitalocean.com
# Create new Droplet:
# - Ubuntu 22.04 LTS
# - Basic plan: $6/month (1GB RAM, 1 CPU)
# - Choose datacenter region closest to users
```

### Step 2: Server Setup
```bash
# Connect via SSH
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install git -y
```

### Step 3: Deploy OnStream
```bash
# Clone repository (or upload files)
git clone YOUR_ONSTREAM_REPO
cd onstream

# Configure environment
cp .env.example .env
nano .env
# Update with your domain and settings

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Domain Setup
```bash
# Point your domain to the droplet IP
# Add A record: onstream.yourdomain.com → YOUR_DROPLET_IP

# Install Nginx for reverse proxy
apt install nginx -y

# Configure Nginx
cat > /etc/nginx/sites-available/onstream << 'EOF'
server {
    listen 80;
    server_name onstream.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/onstream /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Install SSL certificate
apt install certbot python3-certbot-nginx -y
certbot --nginx -d onstream.yourdomain.com
```

---

## 🔥 Option 2: Railway Deployment

### Step 1: Prepare for Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Create Project
```bash
# Initialize Railway project
railway init

# Link to existing project or create new
railway link
```

### Step 3: Configure Environment
```bash
# Set environment variables
railway variables set TMDB_API_KEY=your_tmdb_key
railway variables set JWT_SECRET_KEY=your_secret_key
railway variables set MONGO_URL=mongodb://mongo:27017/onstream

# Create railway.json
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "docker-compose up",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

### Step 4: Deploy
```bash
# Deploy to Railway
railway up

# Get deployment URL
railway domain
```

---

## ⚡ Option 3: Vercel + PlanetScale

### Step 1: Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Configure environment variables in Vercel dashboard:
# REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Step 2: Deploy Backend to Railway
```bash
# Deploy backend separately
cd ../backend
railway init
railway up

# Configure environment variables
railway variables set MONGO_URL=mongodb+srv://your-planetscale-url
railway variables set TMDB_API_KEY=your_key
railway variables set CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### Step 3: Database on PlanetScale
```bash
# Create account at planetscale.com
# Create database: onstream
# Get connection string
# Add to backend environment variables
```

---

## 📦 Option 4: Docker + VPS

### Create Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    environment:
      - REACT_APP_BACKEND_URL=https://yourdomain.com
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017/onstream
      - TMDB_API_KEY=${TMDB_API_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - CORS_ORIGINS=https://yourdomain.com

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30

volumes:
  mongodb_data:
```

### Deploy Script
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying OnStream to production..."

# Update code
git pull origin main

# Build and deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Health check
sleep 30
if curl -f http://localhost/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo "🎉 OnStream is live at https://yourdomain.com"
```

---

## 🔒 Security Checklist

### SSL/HTTPS Setup:
```bash
# Let's Encrypt (Free SSL)
certbot --nginx -d yourdomain.com

# Or use Cloudflare for free SSL + CDN
```

### Firewall Configuration:
```bash
# UFW Firewall
ufw enable
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS
```

### Environment Security:
```bash
# Secure .env files
chmod 600 .env
chown root:root .env

# Use secrets management in production
# - Railway: Built-in secrets
# - Digital Ocean: App Platform secrets
# - Vercel: Environment variables
```

---

## 📊 Monitoring & Maintenance

### Health Checks:
```bash
# Create healthcheck endpoint
curl https://yourdomain.com/health

# Monitor uptime
# - UptimeRobot (free)
# - Pingdom
# - StatusCake
```

### Backup Strategy:
```bash
# MongoDB backup
docker exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# Automated backups
# - Digital Ocean snapshots
# - AWS S3 sync
# - Railway automatic backups
```

### Log Management:
```bash
# View logs
docker-compose logs -f

# Centralized logging
# - Railway: Built-in logging
# - Digital Ocean: Papertrail
# - Self-hosted: ELK stack
```

---

## 🎯 Production URLs

After deployment, your OnStream will be available at:

### PWA Installation:
- **Web**: https://yourdomain.com
- **Mobile**: Add to Home Screen
- **Desktop**: Install from browser

### APK Distribution:
- **Direct**: Upload APK to your server
- **Play Store**: Submit for review
- **Alternative**: F-Droid, APKPure

---

## 🚀 Quick Start Commands

### Digital Ocean One-Liner:
```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/onstream/main/deploy-digitalocean.sh | bash
```

### Railway One-Liner:
```bash
railway login && railway init && railway up
```

### Vercel One-Liner:
```bash
cd frontend && vercel --prod
```

---

## 🎉 Deployment Complete!

Your OnStream is now:

✅ **Globally accessible** via web URL  
✅ **PWA installable** on all devices  
✅ **Android APK ready** for distribution  
✅ **Scalable** with cloud infrastructure  
✅ **Secure** with HTTPS and proper configuration  
✅ **Mobile-optimized** for perfect user experience  

**Your users can now:**
- Stream movies/TV shows for free
- Install as native app on any device
- Access from anywhere in the world
- Enjoy fast, reliable streaming

**Next Steps:**
1. Test your deployment URL
2. Share with users for testing  
3. Generate and distribute APK
4. Monitor usage and performance
5. Collect feedback and iterate

🎬 **OnStream is live and ready to serve millions of users!**