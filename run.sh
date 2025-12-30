#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Budget App...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if MongoDB URL is set
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating one with default values...${NC}"
    cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=budget_app
CORS_ORIGINS=http://localhost:3000
EOF
    echo -e "${YELLOW}📝 Please update backend/.env with your MongoDB connection string${NC}"
fi

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Setup and start Backend
echo -e "${GREEN}📦 Setting up Backend...${NC}"
cd "$SCRIPT_DIR/backend"

# Create virtual environment if it doesn't exist
if [ ! -d "../venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv ../venv
fi

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
echo -e "${GREEN}Installing backend dependencies...${NC}"
pip install -q -r requirements.txt

# Start backend server
echo -e "${GREEN}🖥️  Starting Backend on http://localhost:8000${NC}"
uvicorn server:app --reload --port 8000 &
BACKEND_PID=$!

# Setup and start Frontend
echo -e "${GREEN}📦 Setting up Frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}Installing frontend dependencies...${NC}"
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install --legacy-peer-deps
    fi
fi

# Start frontend server
echo -e "${GREEN}🌐 Starting Frontend on http://localhost:3000${NC}"
if command -v yarn &> /dev/null; then
    yarn start &
else
    npm start &
fi
FRONTEND_PID=$!

echo -e "${GREEN}✅ Both servers are running!${NC}"
echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}   Backend:  http://localhost:8000/api${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait

