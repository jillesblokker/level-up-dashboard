// Centralized error handling utility
// Provides consistent error handling patterns across the application

export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  context?: string;
  timestamp: Date;
}

export class AppError extends Error {
  public code: string;
  public status: number;
  public context: string;
  public timestamp: Date;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, context: string = '') {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.context = context;
    this.timestamp = new Date();
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle API errors
  handleApiError(error: any, context: string = ''): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Response) {
      appError = new AppError(
        `HTTP ${error.status}: ${error.statusText}`,
        'API_ERROR',
        error.status,
        context
      );
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        'GENERAL_ERROR',
        500,
        context
      );
    } else {
      appError = new AppError(
        String(error),
        'UNKNOWN_ERROR',
        500,
        context
      );
    }

    this.logError(appError);
    return appError;
  }

  // Handle fetch errors with JSON response checking
  async handleFetchError(response: Response, context: string = ''): Promise<AppError> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        return new AppError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          context
        );
      } catch {
        return new AppError(
          `HTTP ${response.status}: ${response.statusText}`,
          'API_ERROR',
          response.status,
          context
        );
      }
    } else {
      return new AppError(
        `Non-JSON response received: ${response.status} ${response.statusText}`,
        'INVALID_RESPONSE',
        response.status,
        context
      );
    }
  }

  // Log error for debugging
  private logError(error: AppError) {
    this.errorLog.push({
      message: error.message,
      code: error.code,
      status: error.status,
      context: error.context,
      timestamp: error.timestamp,
    });

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    console.error('[ErrorHandler]', {
      message: error.message,
      code: error.code,
      status: error.status,
      context: error.context,
      timestamp: error.timestamp.toISOString(),
    });
  }

  // Get recent errors for debugging
  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errorLog.slice(-count);
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }

  // Check if response is valid JSON
  static isValidJsonResponse(response: Response): boolean {
    const contentType = response.headers.get('content-type');
    return contentType !== null && contentType.includes('application/json');
  }

  // Safe JSON parsing with error handling
  static async safeJsonParse(response: Response): Promise<any> {
    if (!ErrorHandler.isValidJsonResponse(response)) {
      throw new AppError(
        'Non-JSON response received',
        'INVALID_RESPONSE',
        response.status,
        'JSON_PARSING'
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new AppError(
        'Failed to parse JSON response',
        'JSON_PARSE_ERROR',
        response.status,
        'JSON_PARSING'
      );
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Helper function for common error patterns
export function createErrorHandler(context: string) {
  return {
    handleApiError: (error: any) => errorHandler.handleApiError(error, context),
    handleFetchError: (response: Response) => errorHandler.handleFetchError(response, context),
  };
}