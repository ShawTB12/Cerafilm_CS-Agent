import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 統一されたエラーハンドリングクラス
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isAuthError: boolean;
  public readonly retryable: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    options: {
      isAuthError?: boolean;
      retryable?: boolean;
      details?: any;
    } = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.isAuthError = options.isAuthError || false;
    this.retryable = options.retryable || false;
    this.details = options.details;
  }

  static fromResponse(response: Response, details?: any): APIError {
    const isAuthError = response.status === 401 || response.status === 403;
    const retryable = response.status >= 500 || response.status === 429;

    return new APIError(
      `API request failed: ${response.status} ${response.statusText}`,
      `HTTP_${response.status}`,
      response.status,
      {
        isAuthError,
        retryable,
        details,
      }
    );
  }

  static fromError(error: any): APIError {
    if (error instanceof APIError) {
      return error;
    }

    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const isAuthError = this.isAuthenticationError(error);
    const retryable = this.isRetryableError(error);

    return new APIError(
      errorMessage,
      'UNKNOWN_ERROR',
      500,
      {
        isAuthError,
        retryable,
        details: error,
      }
    );
  }

  private static isAuthenticationError(error: any): boolean {
    const errorString = error?.toString().toLowerCase() || '';
    const authKeywords = [
      'unauthorized',
      'authentication',
      'invalid_token',
      'token_expired',
      'invalid_grant',
      'access_denied',
      'forbidden',
    ];

    return authKeywords.some(keyword => errorString.includes(keyword));
  }

  private static isRetryableError(error: any): boolean {
    const errorString = error?.toString().toLowerCase() || '';
    const retryableKeywords = [
      'network',
      'timeout',
      'connection',
      'rate_limit',
      'server_error',
      'internal_server_error',
      'bad_gateway',
      'service_unavailable',
      'gateway_timeout',
    ];

    return retryableKeywords.some(keyword => errorString.includes(keyword));
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isAuthError: this.isAuthError,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

// API応答の統一フォーマット
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    retryCount?: number;
  };
}

export function createSuccessResponse<T>(data: T, statusCode: number = 200, meta?: any) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }, { status: statusCode });
}

export function createErrorResponse(message: string, statusCode: number = 500, meta?: any) {
  return NextResponse.json({
    success: false,
    error: {
      code: `HTTP_${statusCode}`,
      message,
      details: null,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }, { status: statusCode });
}

// リトライ機能付きAPI呼び出し
export async function retryableApiCall<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = (error) => APIError.fromError(error).retryable,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`Operation succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      console.error(`Operation failed on attempt ${attempt}:`, error);
      
      // リトライ条件をチェック
      if (!retryCondition(error) || attempt >= maxRetries) {
        break;
      }
      
      // 指数バックオフでリトライ
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw APIError.fromError(lastError);
}

// 日付フォーマット用のユーティリティ
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 環境変数の検証
export function validateEnvVar(varName: string, defaultValue?: string): string {
  const value = process.env[varName] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${varName} is required`);
  }
  return value;
}

// セキュアなランダム文字列生成
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
