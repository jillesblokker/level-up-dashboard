# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for the Level Up Dashboard application.

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click on "New OAuth App" button
4. Fill in the form:
   - **Application Name**: Level Up Dashboard
   - **Homepage URL**: `http://localhost:3005`
   - **Application Description**: (Optional) A dashboard for the Level Up game
   - **Authorization callback URL**: `http://localhost:3005/api/auth/callback/github`
5. Click "Register application"

## Step 2: Get Your Client ID and Secret

After registering your application, you'll be taken to your new OAuth App's page where you can see your Client ID.

1. Note your Client ID
2. Click "Generate a new client secret"
3. Copy the generated client secret (you won't be able to see it again)

## Step 3: Update Your Environment Variables

1. Open the `.env` file in the root of your project
2. Replace the placeholder values with your actual GitHub OAuth credentials:

```
GITHUB_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
```

## Step 4: Restart Your Development Server

After updating the environment variables, restart your development server:

```bash
npm run dev
```

## Troubleshooting

If you encounter authentication errors:

1. Verify that the Client ID and Secret are correctly copied into your `.env` file
2. Make sure the Authorization callback URL in GitHub matches exactly: `http://localhost:3005/api/auth/callback/github`
3. Ensure your development server is running on port 3005
4. Check browser console for any CORS or network errors
5. Try clearing your browser cookies and cache

## Production Setup

For production deployment, make sure to:

1. Create a separate GitHub OAuth App with your production URL
2. Update the callback URL to your production domain
3. Set the `NEXTAUTH_URL` environment variable to your production URL
4. Set `NEXTAUTH_DEBUG=false` for production 