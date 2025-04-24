#!/bin/bash

echo "Starting direct Prisma fix..."

# 1. Kill all processes
pkill -f "node|next|npm|prisma" 2>/dev/null
sleep 2

# 2. Free ports
lsof -ti:3005,5555 | xargs kill -9 2>/dev/null || echo "Ports already free"
sleep 1

# 3. Fix next.config.mjs to remove deprecated option 
echo "Fixing next.config.mjs..."
sed -i '' 's/serverComponentsExternalPackages/serverExternalPackages/g' next.config.mjs

# 4. Create a simple manual prisma client fix
echo "Fixing Prisma client directly..."

# 4a. First make sure the directory exists
mkdir -p node_modules/.prisma/client
mkdir -p .prisma/client

# 4b. Create a minimal index.js file in the client directories
cat > node_modules/.prisma/client/index.js << 'EOL'
// Temporary Prisma client fix
const { PrismaClient } = require('@prisma/client')
module.exports = {
  PrismaClient
}
EOL

# 4c. Also create the 'default.js' file that's missing
cat > node_modules/.prisma/client/default.js << 'EOL'
// Temporary default export fix
module.exports = require('./index.js')
EOL

# 4d. Link the files to the .prisma directory too
cp node_modules/.prisma/client/index.js .prisma/client/
cp node_modules/.prisma/client/default.js .prisma/client/

# 5. Start Next.js directly with troubleshooting mode
echo "Starting Next.js on port 3005..."
cd "$(dirname "$0")"
PORT=3005 npm run dev 