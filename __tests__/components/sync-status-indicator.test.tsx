import { render, screen } from '@testing-library/react';
import { SyncStatusIndicator } from '@/components/sync-status-indicator';

describe('SyncStatusIndicator', () => {
  const defaultProps = {
    isSyncing: false,
    lastSync: Date.now() - 30000, // 30 seconds ago
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show live status when recently synced', () => {
    render(<SyncStatusIndicator {...defaultProps} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Live')).toHaveClass('text-green-400');
  });

  it('should show syncing status when syncing', () => {
    render(<SyncStatusIndicator {...defaultProps} isSyncing={true} />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.getByText('Syncing...')).toHaveClass('text-blue-400');
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should show offline status when not recently synced', () => {
    const oldLastSync = Date.now() - 120000; // 2 minutes ago
    render(<SyncStatusIndicator {...defaultProps} lastSync={oldLastSync} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toHaveClass('text-gray-400');
  });

  it('should show error status when there is an error', () => {
    render(<SyncStatusIndicator {...defaultProps} error="Network error" />);

    expect(screen.getByText('Sync Error')).toBeInTheDocument();
    expect(screen.getByText('Sync Error')).toHaveClass('text-red-400');
  });

  it('should prioritize error over syncing status', () => {
    render(<SyncStatusIndicator 
      {...defaultProps} 
      isSyncing={true} 
      error="Network error" 
    />);

    expect(screen.getByText('Sync Error')).toBeInTheDocument();
    expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
  });

  it('should prioritize syncing over offline status', () => {
    const oldLastSync = Date.now() - 120000; // 2 minutes ago
    render(<SyncStatusIndicator 
      {...defaultProps} 
      isSyncing={true}
      lastSync={oldLastSync}
    />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<SyncStatusIndicator {...defaultProps} className="custom-class" />);

    const badge = screen.getByText('Live').closest('div');
    expect(badge).toHaveClass('custom-class');
  });

  it('should show correct icon for live status', () => {
    render(<SyncStatusIndicator {...defaultProps} />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
    expect(icon).not.toHaveClass('animate-spin');
  });

  it('should show correct icon for syncing status', () => {
    render(<SyncStatusIndicator {...defaultProps} isSyncing={true} />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3', 'animate-spin');
  });

  it('should show correct icon for error status', () => {
    render(<SyncStatusIndicator {...defaultProps} error="Network error" />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
    expect(icon).not.toHaveClass('animate-spin');
  });

  it('should show correct icon for offline status', () => {
    const oldLastSync = Date.now() - 120000; // 2 minutes ago
    render(<SyncStatusIndicator {...defaultProps} lastSync={oldLastSync} />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
    expect(icon).not.toHaveClass('animate-spin');
  });

  it('should handle zero lastSync', () => {
    render(<SyncStatusIndicator {...defaultProps} lastSync={0} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should handle very recent lastSync', () => {
    const recentLastSync = Date.now() - 1000; // 1 second ago
    render(<SyncStatusIndicator {...defaultProps} lastSync={recentLastSync} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should handle exactly 1 minute ago lastSync', () => {
    const oneMinuteAgo = Date.now() - 60000; // exactly 1 minute ago
    render(<SyncStatusIndicator {...defaultProps} lastSync={oneMinuteAgo} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should handle empty error string', () => {
    render(<SyncStatusIndicator {...defaultProps} error="" />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should handle null error', () => {
    render(<SyncStatusIndicator {...defaultProps} error={null} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should handle undefined error', () => {
    render(<SyncStatusIndicator {...defaultProps} error={undefined} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
