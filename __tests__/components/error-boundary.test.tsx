import React from 'react';
import { render, screen, fireEvent } from '@/lib/testing/test-utils';
import ErrorBoundary, { withErrorBoundary } from '@/components/error-boundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
};

// Component wrapped with error boundary
const WrappedComponent = withErrorBoundary(ThrowError);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ErrorBoundary Component', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders error fallback when child throws error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument();
    });

    it('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      expect(screen.getByText(/Test error for ErrorBoundary/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('calls resetError when Try Again button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Simulate error being resolved
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('navigates to home when Go Home button is clicked', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByText('Go Home');
      fireEvent.click(goHomeButton);

      expect(window.location.href).toBe('/');

      window.location = originalLocation;
    });

    it('logs error details to console', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Error Boundary Details');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      render(<WrappedComponent shouldThrow={false} />);
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('handles errors in wrapped component', () => {
      render(<WrappedComponent shouldThrow={true} />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('maintains component display name', () => {
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(ThrowError)');
    });
  });

  describe('Custom Fallback', () => {
    const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
      <div>
        <h1>Custom Error Page</h1>
        <p>Error: {error.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Page')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error for ErrorBoundary')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('calls custom resetError function', () => {
      const { rerender } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Custom Reset');
      fireEvent.click(resetButton);

      // Simulate error being resolved
      rerender(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Boundary State Management', () => {
    it('maintains error state correctly', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Simulate error being resolved
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show normal content
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('handles multiple error states', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Start with no error
      expect(screen.getByText('No error')).toBeInTheDocument();

      // Introduce error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Resolve error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show normal content again
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      // Check button accessibility
      expect(buttons[0]).toHaveAccessibleName('Try Again');
      expect(buttons[1]).toHaveAccessibleName('Go Home');
    });

    it('provides clear error information', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument();
      expect(screen.getByText('If this problem persists, please contact support.')).toBeInTheDocument();
    });
  });
});
