#!/bin/bash

echo "🚀 OnStream Development Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check system requirements
print_step "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v | sed 's/v//')
    print_success "Node.js $NODE_VERSION installed"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+"
    exit 1
else
    PYTHON_VERSION=$(python3 -V 2>&1 | sed 's/.* //')
    print_success "Python $PYTHON_VERSION installed"
fi

# Check pip
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3"
    exit 1
else
    print_success "pip3 installed"
fi

# Check yarn
if ! command -v yarn &> /dev/null; then
    print_warning "Yarn not found, installing..."
    npm install -g yarn
    if [ $? -eq 0 ]; then
        print_success "Yarn installed successfully"
    else
        print_error "Failed to install Yarn"
        exit 1
    fi
else
    print_success "Yarn installed"
fi

# Create environment file
print_step "Setting up environment configuration..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env file from template"
    print_warning "Please edit .env file with your API keys and configuration"
else
    print_success ".env file already exists"
fi

# Backend setup
print_step "Setting up backend dependencies..."

cd backend || exit 1

if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

print_step "Activating virtual environment and installing dependencies..."
source venv/bin/activate

pip install -r requirements.txt
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

cd ..

# Frontend setup
print_step "Setting up frontend dependencies..."

cd frontend || exit 1

yarn install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# PWA Icons
print_step "Generating PWA icons..."
node generate-icons.js
print_success "PWA icons generated"

# Database check
print_step "Checking MongoDB connection..."

if command -v mongod &> /dev/null; then
    print_success "MongoDB installed locally"
else
    print_warning "MongoDB not installed locally. Using Docker or external MongoDB service."
fi

# Docker check (optional)
if command -v docker &> /dev/null; then
    print_success "Docker available for containerized deployment"
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose available"
    else
        print_warning "Docker Compose not found. Install for easy deployment."
    fi
else
    print_warning "Docker not installed. Install for easy deployment and production builds."
fi

# Final instructions
echo ""
echo "🎉 OnStream Development Setup Complete!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your API keys:"
echo "   - Get TMDB API key from https://www.themoviedb.org/settings/api"
echo "   - Update JWT_SECRET_KEY with a secure random string"
echo ""
echo "2. Start development servers:"
echo "   yarn dev              # Start both frontend and backend"
echo "   # OR manually:"
echo "   cd backend && source venv/bin/activate && python server.py"
echo "   cd frontend && yarn start"
echo ""
echo "3. Access OnStream:"
echo "   🌐 Web: http://localhost:3000"
echo "   📱 Mobile: Open in mobile browser for PWA experience"
echo "   🔧 API: http://localhost:8001/api/docs"
echo ""
echo "4. Build for production:"
echo "   yarn build:android     # Build Android APK"
echo "   yarn deploy:docker     # Deploy with Docker"
echo ""
echo "📖 Documentation:"
echo "   📱 Android APK: ./android-build-setup.md"
echo "   ☁️  Cloud Deploy: ./cloud-deployment-guide.md"
echo "   📚 Full README: ./README.md"
echo ""
print_success "Happy streaming! 🎬"