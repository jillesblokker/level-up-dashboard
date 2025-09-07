import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineQueueIndicator } from '@/components/offline-queue-indicator';

describe('OfflineQueueIndicator', () => {
  const defaultProps = {
    isOnline: true,
    queueStats: {
      total: 0,
      pending: 0,
      retrying: 0,
      oldestItem: null,
    },
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when online and no queue', () => {
    const { container } = render(<OfflineQueueIndicator {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show offline status when offline', () => {
    render(<OfflineQueueIndicator {...defaultProps} isOnline={false} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toHaveClass('text-red-400');
  });

  it('should show syncing status when processing', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
      isProcessing={true}
    />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.getByText('Syncing...')).toHaveClass('text-blue-400');
  });

  it('should show failed status when there are retrying items', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 3, pending: 1, retrying: 2, oldestItem: Date.now() }}
    />);

    expect(screen.getByText('3 Failed')).toBeInTheDocument();
    expect(screen.getByText('3 Failed')).toHaveClass('text-red-400');
  });

  it('should show pending status when there are pending items', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
    />);

    expect(screen.getByText('2 Pending')).toBeInTheDocument();
    expect(screen.getByText('2 Pending')).toHaveClass('text-amber-400');
  });

  it('should prioritize failed over pending status', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 5, pending: 3, retrying: 2, oldestItem: Date.now() }}
    />);

    expect(screen.getByText('5 Failed')).toBeInTheDocument();
    expect(screen.queryByText('5 Pending')).not.toBeInTheDocument();
  });

  it('should prioritize syncing over other statuses', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 5, pending: 3, retrying: 2, oldestItem: Date.now() }}
      isProcessing={true}
    />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.queryByText('5 Failed')).not.toBeInTheDocument();
  });

  it('should show age of oldest item', () => {
    const oneMinuteAgo = Date.now() - 60000;
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: oneMinuteAgo }}
    />);

    expect(screen.getByText('1m ago')).toBeInTheDocument();
  });

  it('should show sync button when online and not processing', () => {
    const mockProcessQueue = jest.fn();
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
      onProcessQueue={mockProcessQueue}
    />);

    const syncButton = screen.getByText('Sync');
    expect(syncButton).toBeInTheDocument();

    fireEvent.click(syncButton);
    expect(mockProcessQueue).toHaveBeenCalledTimes(1);
  });

  it('should not show sync button when offline', () => {
    const mockProcessQueue = jest.fn();
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      isOnline={false}
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
      onProcessQueue={mockProcessQueue}
    />);

    expect(screen.queryByText('Sync')).not.toBeInTheDocument();
  });

  it('should not show sync button when processing', () => {
    const mockProcessQueue = jest.fn();
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
      isProcessing={true}
      onProcessQueue={mockProcessQueue}
    />);

    expect(screen.queryByText('Sync')).not.toBeInTheDocument();
  });

  it('should show clear button when there are items', () => {
    const mockClearQueue = jest.fn();
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 2, pending: 2, retrying: 0, oldestItem: Date.now() }}
      onClearQueue={mockClearQueue}
    />);

    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockClearQueue).toHaveBeenCalledTimes(1);
  });

  it('should not show clear button when no items', () => {
    const mockClearQueue = jest.fn();
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 0, pending: 0, retrying: 0, oldestItem: null }}
      onClearQueue={mockClearQueue}
    />);

    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      isOnline={false}
      className="custom-class"
    />);

    const container = screen.getByText('Offline').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('should format age correctly for different time periods', () => {
    const testCases = [
      { age: 0, expected: 'Just now' },
      { age: 30000, expected: 'Just now' },
      { age: 60000, expected: '1m ago' },
      { age: 120000, expected: '2m ago' },
      { age: 3600000, expected: '1h ago' },
      { age: 7200000, expected: '2h ago' },
    ];

    testCases.forEach(({ age, expected }) => {
      const timestamp = Date.now() - age;
      const { getByText } = render(<OfflineQueueIndicator 
        {...defaultProps} 
        queueStats={{ total: 1, pending: 1, retrying: 0, oldestItem: timestamp }}
      />);

      expect(getByText(expected)).toBeInTheDocument();
    });
  });

  it('should handle null oldestItem', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 1, pending: 1, retrying: 0, oldestItem: null }}
    />);

    // Should not crash and should not show age
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('should handle zero total items', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 0, pending: 0, retrying: 0, oldestItem: null }}
    />);

    // Should not render anything
    expect(screen.queryByText(/Pending|Failed|Syncing|Offline/)).not.toBeInTheDocument();
  });

  it('should show correct icon for offline status', () => {
    render(<OfflineQueueIndicator {...defaultProps} isOnline={false} />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
  });

  it('should show correct icon for syncing status', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 1, pending: 1, retrying: 0, oldestItem: Date.now() }}
      isProcessing={true}
    />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
  });

  it('should show correct icon for failed status', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 1, pending: 0, retrying: 1, oldestItem: Date.now() }}
    />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
  });

  it('should show correct icon for pending status', () => {
    render(<OfflineQueueIndicator 
      {...defaultProps} 
      queueStats={{ total: 1, pending: 1, retrying: 0, oldestItem: Date.now() }}
    />);

    const icon = screen.getByRole('status', { hidden: true });
    expect(icon).toHaveClass('h-3', 'w-3');
  });
});
