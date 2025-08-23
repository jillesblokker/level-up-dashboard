const fs = require('fs');

// Read the .env.local file
const envContent = fs.readFileSync('.env.local', 'utf8');

// Find the SUPABASE_SERVICE_ROLE_KEY
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*?)(?=\n[A-Z]|$)/s);
if (keyMatch) {
  const key = keyMatch[1].replace(/\n/g, '');
  console.log('Found key length:', key.length);
  console.log('Key starts with:', key.substring(0, 50));
  console.log('Key ends with:', key.substring(key.length - 50));
  
  // Test if it's a valid JWT format
  const parts = key.split('.');
  console.log('JWT parts:', parts.length);
  if (parts.length === 3) {
    console.log('✅ Valid JWT format');
  } else {
    console.log('❌ Invalid JWT format');
  }
} else {
  console.log('❌ Key not found');
}
