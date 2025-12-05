#!/bin/bash

echo "Starting bypass fix..."

# Kill all processes
pkill -f "node|next|npm|prisma" 2>/dev/null || true
sleep 2

# Free ports
lsof -ti:3005,5555 | xargs kill -9 2>/dev/null || echo "Ports already free"
sleep 1

# Fix next.config.mjs to remove deprecated experimental option
echo "Fixing Next.js config to remove deprecated option..."
cp next.config.mjs next.config.mjs.bak
sed -i '' 's/serverComponentsExternalPackages/serverExternalPackages/g' next.config.mjs

# Create a simple patch for the missing Prisma client
echo "Creating manual Prisma client..."

# First ensure the .prisma directory exists
mkdir -p .prisma/client
mkdir -p node_modules/.prisma/client

# Now create the minimal files needed for Prisma client
cat > .prisma/client/index.js << 'EOL'
// Temporary manual Prisma client index.js
const { PrismaClient } = require('@prisma/client');
module.exports = { PrismaClient };
EOL

cat > .prisma/client/default.js << 'EOL'
// Temporary manual Prisma client default.js
module.exports = require('./index.js');
EOL

# Copy the files to node_modules location too
cp .prisma/client/index.js node_modules/.prisma/client/
cp .prisma/client/default.js node_modules/.prisma/client/

# Create a minimal package.json for the .prisma/client directory
cat > .prisma/client/package.json << 'EOL'
{
  "name": ".prisma/client",
  "main": "index.js",
  "types": "index.d.ts",
  "version": "0.0.0"
}
EOL

# Create a type definition file
cat > .prisma/client/index.d.ts << 'EOL'
// Temporary type definitions
import { PrismaClient as OriginalPrismaClient } from '@prisma/client';
export { PrismaClient } from '@prisma/client';
EOL

# Fix the server start script to avoid npm install issues
echo "Creating standalone server script..."
cat > start-nextjs.sh << 'EOL'
#!/bin/bash
echo "Starting Next.js without npm..."
cd "$(dirname "$0")"
export PORT=3005
export NODE_ENV=development

# First kill any existing process
lsof -ti:3005 | xargs kill -9 2>/dev/null || echo "Port 3005 is free"

# Start Next.js directly
./node_modules/.bin/next dev -p 3005
EOL

chmod +x start-nextjs.sh

# Use a direct approach to start Prisma Studio
echo "Creating standalone Prisma Studio script..."
cat > start-prisma.sh << 'EOL'
#!/bin/bash
echo "Starting Prisma Studio without npm..."
cd "$(dirname "$0")"
export NODE_ENV=production

# First kill any existing process
lsof -ti:5555 | xargs kill -9 2>/dev/null || echo "Port 5555 is free" 

# Start Prisma Studio directly
./node_modules/.bin/prisma studio
EOL

chmod +x start-prisma.sh

echo "Done! To start the servers, run:"
echo "- ./start-nextjs.sh for Next.js on port 3005"
echo "- ./start-prisma.sh for Prisma Studio on port 5555"
echo ""
echo "Starting Next.js now..."
./start-nextjs.sh 