"use client"

import { AlertCircle } from 'lucide-react'

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: { [key: string]: string } = {
    missing_params: 'Missing required parameters for authentication.',
    state_mismatch: 'Invalid state parameter. Please try again.',
    token_error: 'Failed to get access token from GitHub.',
    user_error: 'Failed to get user data from GitHub.',
    callback_error: 'An error occurred during authentication.',
    default: 'An unknown error occurred. Please try again.',
  }

  const error = searchParams.error || 'default'
  const errorMessage = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Authentication Error</h1>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
