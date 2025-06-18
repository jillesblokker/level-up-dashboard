export const env = {
  GITHUB_CLIENT_ID: process.env['GITHUB_ID'],
  GITHUB_CLIENT_SECRET: process.env['GITHUB_SECRET'],
  GITHUB_CALLBACK_URL: process.env['GITHUB_CALLBACK_URL'],
  DATABASE_URL: process.env['DATABASE_URL'],
} as const; 