import { render, screen, fireEvent, act } from '@testing-library/react'
import SignIn from './page'
import { signIn } from 'next-auth/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { skipAuth } from '@/app/actions/auth'

// Mock next-auth and auth actions
vi.mock('next-auth/react')
vi.mock('@/app/actions/auth')

describe('SignIn Page', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    vi.clearAllMocks()
  })

  it('renders all UI elements correctly', () => {
    render(<SignIn />)

    // Check for main heading
    expect(screen.getByText('Begin Your Quest')).toBeInTheDocument()
    expect(screen.getByText('Choose your path to adventure')).toBeInTheDocument()

    // Check for GitHub sign in button
    const githubButton = screen.getByRole('button', { name: /Sign in with GitHub Sigil/i })
    expect(githubButton).toBeInTheDocument()
    expect(screen.getByAltText('GitHub Sigil')).toBeInTheDocument()

    // Check for Anonymous option
    const anonymousButton = screen.getByRole('button', { name: /Anonymous Adventurer/i })
    expect(anonymousButton).toBeInTheDocument()

    // Check for footer links
    expect(screen.getByText(/Adventurer's Code/)).toBeInTheDocument()
    expect(screen.getByText(/Realm Laws/)).toBeInTheDocument()
  })

  it('handles GitHub sign in correctly', async () => {
    render(<SignIn />)
    
    const githubButton = screen.getByRole('button', { name: /Sign in with GitHub Sigil/i })
    
    await act(async () => {
      fireEvent.click(githubButton)
    })

    expect(signIn).toHaveBeenCalledWith('github', {
      callbackUrl: expect.any(String),
      redirect: false,
    })
  })

  it('shows loading state when signing in', async () => {
    render(<SignIn />)
    
    const githubButton = screen.getByRole('button', { name: /Sign in with GitHub Sigil/i })
    
    await act(async () => {
      fireEvent.click(githubButton)
    })

    expect(screen.getByText('Summoning Portal...')).toBeInTheDocument()
  })

  it('displays error message when there is an error', () => {
    const errorMessage = 'Unable to connect to GitHub. Please try again.'
    const useSearchParamsMock = vi.fn(() => new URLSearchParams({ error: 'OAuthCallback' }))
    vi.spyOn(require('next/navigation'), 'useSearchParams').mockImplementation(useSearchParamsMock)

    render(<SignIn />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('handles anonymous login correctly', async () => {
    render(<SignIn />)
    
    const anonymousButton = screen.getByRole('button', { name: /Anonymous Adventurer/i })
    
    await act(async () => {
      fireEvent.click(anonymousButton)
    })

    expect(skipAuth).toHaveBeenCalled()
  })
}) 