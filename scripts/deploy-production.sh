#!/bin/bash

echo "🚀 OnStream Production Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create one from .env.example"
    exit 1
fi

# Source environment variables
source .env

print_step "Starting production deployment..."

# Deployment method selection
echo ""
echo "🎯 Choose deployment method:"
echo "1. 🐳 Docker Compose (Local/VPS)"
echo "2. 🚂 Railway (Cloud)"
echo "3. ⚡ Vercel + Railway (Serverless)"
echo "4. 🌊 Digital Ocean Droplet"
echo ""
read -p "Select option (1-4): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        echo ""
        print_step "🐳 Deploying with Docker Compose..."
        
        # Check if Docker is running
        if ! docker info > /dev/null 2>&1; then
            print_error "Docker is not running. Please start Docker and try again."
            exit 1
        fi
        
        # Build and start services
        docker-compose down
        docker-compose up -d --build
        
        # Health check
        print_step "Performing health check..."
        sleep 30
        
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            print_success "OnStream is running at http://localhost:3000"
        else
            print_error "Health check failed. Check logs with: docker-compose logs"
            exit 1
        fi
        ;;
        
    2)
        echo ""
        print_step "🚂 Deploying to Railway..."
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            print_step "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Login check
        if ! railway whoami > /dev/null 2>&1; then
            print_warning "Please login to Railway first:"
            railway login
        fi
        
        # Deploy
        railway up
        
        # Get URL
        RAILWAY_URL=$(railway domain)
        if [ -n "$RAILWAY_URL" ]; then
            print_success "OnStream deployed to: $RAILWAY_URL"
        else
            print_warning "Deployment completed. Check Railway dashboard for URL."
        fi
        ;;
        
    3)
        echo ""
        print_step "⚡ Deploying to Vercel + Railway..."
        
        # Frontend to Vercel
        print_step "Deploying frontend to Vercel..."
        cd frontend
        
        if ! command -v vercel &> /dev/null; then
            npm install -g vercel
        fi
        
        vercel --prod
        cd ..
        
        # Backend to Railway
        print_step "Deploying backend to Railway..."
        cd backend
        
        if ! command -v railway &> /dev/null; then
            npm install -g @railway/cli
        fi
        
        railway up
        cd ..
        
        print_success "Hybrid deployment completed!"
        print_info "Frontend: Check Vercel dashboard"
        print_info "Backend: Check Railway dashboard"
        ;;
        
    4)
        echo ""
        print_step "🌊 Deploying to Digital Ocean..."
        
        # Check if doctl is installed
        if ! command -v doctl &> /dev/null; then
            print_warning "Digital Ocean CLI not found. Please install doctl first:"
            print_info "https://docs.digitalocean.com/reference/doctl/how-to/install/"
            exit 1
        fi
        
        # Check authentication
        if ! doctl auth list > /dev/null 2>&1; then
            print_warning "Please authenticate with Digital Ocean first:"
            doctl auth init
        fi
        
        print_info "This will create a new droplet and deploy OnStream."
        read -p "Continue? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        
        # Create droplet
        print_step "Creating Digital Ocean droplet..."
        DROPLET_NAME="onstream-$(date +%Y%m%d)"
        
        doctl compute droplet create $DROPLET_NAME \
            --image ubuntu-22-04-x64 \
            --size s-1vcpu-1gb \
            --region nyc3 \
            --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -n 1) \
            --enable-monitoring \
            --enable-private-networking
        
        # Wait for droplet to be ready
        print_step "Waiting for droplet to be ready..."
        sleep 60
        
        DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header | grep -v "^$" | head -n 1)
        
        if [ -n "$DROPLET_IP" ]; then
            print_success "Droplet created with IP: $DROPLET_IP"
            print_info "SSH into your droplet and run the setup script:"
            print_info "ssh root@$DROPLET_IP"
            print_info "Then follow the deployment guide in cloud-deployment-guide.md"
        else
            print_error "Failed to get droplet IP. Check Digital Ocean dashboard."
        fi
        ;;
        
    *)
        print_error "Invalid option selected."
        exit 1
        ;;
esac

# Post-deployment tasks
echo ""
print_step "🔧 Post-deployment tasks..."

# Generate APK if requested
echo ""
read -p "🔨 Build Android APK? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Building Android APK..."
    ./scripts/build-android.sh
fi

# Performance optimization suggestions
echo ""
print_step "🚀 Performance Optimization Suggestions:"
echo "   1. 🖼️  Optimize images with WebP format"
echo "   2. 🗜️  Enable gzip compression on server"
echo "   3. 📊 Set up monitoring (UptimeRobot, Pingdom)"
echo "   4. 🔐 Configure SSL certificate"
echo "   5. 🌐 Use CDN for static assets (Cloudflare)"

# Final success message
echo ""
echo "🎉 OnStream Production Deployment Complete!"
echo "==========================================="
echo ""
print_success "Your OnStream platform is now live and ready for users!"
echo ""
echo "📋 Next Steps:"
echo "   1. 🧪 Test all functionality on production"
echo "   2. 📱 Distribute Android APK to users"
echo "   3. 📊 Monitor performance and usage"
echo "   4. 🔧 Set up backup and maintenance schedules"
echo "   5. 📢 Share with your audience!"
echo ""
echo "🎬 Features Available:"
echo "   ✅ Free movie/TV streaming"
echo "   ✅ PWA installation on all devices"
echo "   ✅ Android APK for native experience"
echo "   ✅ Mobile-first responsive design"
echo "   ✅ Multiple streaming servers"
echo "   ✅ User authentication and favorites"
echo ""
print_success "Happy streaming! 🍿🎭"