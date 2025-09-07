import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestToggleButton } from '@/components/quest-toggle-button';
import { useQuestCompletion } from '@/hooks/useQuestCompletion';

// Mock the useQuestCompletion hook
jest.mock('@/hooks/useQuestCompletion', () => ({
  useQuestCompletion: jest.fn(),
}));

const mockUseQuestCompletion = useQuestCompletion as jest.MockedFunction<typeof useQuestCompletion>;

describe('QuestToggleButton', () => {
  const defaultProps = {
    questId: 'test-quest',
    questName: 'Test Quest',
    completed: false,
    xp: 50,
    gold: 25,
    category: 'might',
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render checkbox variant by default', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render button variant when specified', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} variant="button" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Complete');
  });

  it('should show completed state correctly', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} completed={true} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should show pending state with spinner', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => true),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} />);

    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should be disabled when disabled prop is true', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} disabled={true} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should be disabled when quest is pending', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => true),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should call toggleQuestCompletion when clicked', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: true });
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockToggleQuestCompletion).toHaveBeenCalledWith(
        'test-quest',
        false,
        {
          name: 'Test Quest',
          xp: 50,
          gold: 25,
          category: 'might',
        },
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should call onToggle when quest completion succeeds', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: true });
    const mockOnToggle = jest.fn();

    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith('test-quest', true);
    });
  });

  it('should not call onToggle when quest completion fails', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: false, error: 'Failed' });
    const mockOnToggle = jest.fn();

    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  it('should handle button variant click', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: true });
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} variant="button" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToggleQuestCompletion).toHaveBeenCalled();
    });
  });

  it('should show correct button text for completed quest', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} completed={true} variant="button" />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Completed');
  });

  it('should show spinner in button when pending', () => {
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: jest.fn(),
      isQuestPending: jest.fn(() => true),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} variant="button" />);

    const button = screen.getByRole('button');
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should not call toggleQuestCompletion when disabled', () => {
    const mockToggleQuestCompletion = jest.fn();
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton {...defaultProps} disabled={true} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggleQuestCompletion).not.toHaveBeenCalled();
  });

  it('should use default values for xp and gold when not provided', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: true });
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton 
      questId="test-quest"
      questName="Test Quest"
      completed={false}
      category="might"
      onToggle={jest.fn()}
    />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockToggleQuestCompletion).toHaveBeenCalledWith(
        'test-quest',
        false,
        {
          name: 'Test Quest',
          xp: 50,
          gold: 25,
          category: 'might',
        },
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should handle undefined category gracefully', async () => {
    const mockToggleQuestCompletion = jest.fn().mockResolvedValue({ success: true });
    mockUseQuestCompletion.mockReturnValue({
      toggleQuestCompletion: mockToggleQuestCompletion,
      isQuestPending: jest.fn(() => false),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    render(<QuestToggleButton 
      {...defaultProps}
      category={undefined}
    />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockToggleQuestCompletion).toHaveBeenCalledWith(
        'test-quest',
        false,
        {
          name: 'Test Quest',
          xp: 50,
          gold: 25,
          category: 'general',
        },
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
});
