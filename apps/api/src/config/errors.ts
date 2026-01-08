export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true,
  };
}

export function createErrorResponse(error: string | Error, code: string = 'UNKNOWN_ERROR'): ApiResponse<never> {
  if (error instanceof Error) {
    return {
      error: error.message,
      success: false,
    };
  }
  
  return {
    error,
    success: false,
  };
}

export function handleServiceError(error: unknown, context: string): ApiResponse<never> {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof ServiceError) {
    return createErrorResponse(error.message, error.code);
  }
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 'SERVICE_ERROR');
  }
  
  return createErrorResponse('Unknown error occurred', 'UNKNOWN_ERROR');
}