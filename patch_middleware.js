const fs = require('fs');

let content = fs.readFileSync('middleware.ts', 'utf8');

// Add the interception logic
const injection = `
  // Bypass broken Next.js image optimizer on the live server
  if (pathname.startsWith('/_next/image')) {
    const imageUrl = searchParams.get('url');
    if (imageUrl) {
      return NextResponse.redirect(new URL(imageUrl, request.url));
    }
  }

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
`;
content = content.replace('// If user is signed in and trying to access sign-in/sign-up, redirect to kingdom', injection);

// Update the matcher to include _next/image
// Replace: '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|mp4|webm)).*)',
// With: '/((?!_next/static|_next/data|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|mp4|webm)).*)',
// Wait, an easier way is to just add a specific matcher string for /_next/image!
// 'matcher: ['
//   '/_next/image',
//   '/((?!_next|...

const matcherInjection = `matcher: [
    '/_next/image',
`;
content = content.replace('matcher: [', matcherInjection);

fs.writeFileSync('middleware.ts', content);
