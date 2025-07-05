import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailClient } from '@/lib/gmail-client';
import { CalendarClient } from '@/lib/calendar-client';
import { LineClient } from '@/lib/line-client';
import { checkGmailConfigHealth } from '@/lib/gmail-config';
import { checkLineConfigHealth } from '@/lib/line-config';
import { validateCalendarConfig } from '@/lib/calendar-config';
import { createSuccessResponse, createErrorResponse, APIError } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 基本的な健全性チェック
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        gmail: { status: 'unknown', details: {} },
        calendar: { status: 'unknown', details: {} },
        line: { status: 'unknown', details: {} },
        auth: { status: 'unknown', details: {} },
      },
      warnings: [] as string[],
      errors: [] as string[],
    };

    // Gmail設定の健全性チェック
    try {
      const gmailHealth = checkGmailConfigHealth();
      health.services.gmail.status = gmailHealth.isValid ? 'healthy' : 'unhealthy';
      health.services.gmail.details = gmailHealth;
      health.warnings.push(...gmailHealth.warnings);
      health.errors.push(...gmailHealth.errors);
    } catch (error) {
      health.services.gmail.status = 'error';
      health.services.gmail.details = { error: error instanceof Error ? error.message : String(error) };
      health.errors.push(`Gmail config error: ${error}`);
    }

    // Calendar設定の健全性チェック
    try {
      validateCalendarConfig();
      health.services.calendar.status = 'healthy';
      health.services.calendar.details = { isValid: true };
    } catch (error) {
      health.services.calendar.status = 'error';
      health.services.calendar.details = { error: error instanceof Error ? error.message : String(error) };
      health.errors.push(`Calendar config error: ${error}`);
    }

    // LINE設定の健全性チェック
    try {
      const lineHealth = checkLineConfigHealth();
      health.services.line.status = lineHealth.isValid ? 'healthy' : 'unhealthy';
      health.services.line.details = lineHealth;
      health.warnings.push(...lineHealth.warnings);
      health.errors.push(...lineHealth.errors);
    } catch (error) {
      health.services.line.status = 'error';
      health.services.line.details = { error: error instanceof Error ? error.message : String(error) };
      health.errors.push(`LINE config error: ${error}`);
    }

    // 認証状態の確認
    if (session && session.accessToken) {
      health.services.auth.status = 'healthy';
      health.services.auth.details = { 
        hasSession: true, 
        hasAccessToken: true,
        hasError: !!session.error,
        error: session.error 
      };
      
      if (session.error) {
        health.warnings.push(`Auth session has error: ${session.error}`);
      }
    } else {
      health.services.auth.status = 'partial';
      health.services.auth.details = { 
        hasSession: !!session, 
        hasAccessToken: false 
      };
    }

    // 詳細な接続テスト（認証されている場合のみ）
    if (session && session.accessToken && !session.error) {
      // Gmail接続テスト
      try {
        const gmailClient = new GmailClient(session.accessToken);
        const gmailConnectionTest = await gmailClient.testConnection();
        health.services.gmail.details = {
          ...health.services.gmail.details,
          connectionTest: gmailConnectionTest
        };
        if (!gmailConnectionTest) {
          health.warnings.push('Gmail connection test failed');
        }
      } catch (error) {
        health.services.gmail.details = {
          ...health.services.gmail.details,
          connectionTest: false,
          connectionError: error instanceof Error ? error.message : String(error)
        };
        health.warnings.push(`Gmail connection error: ${error}`);
      }

      // Calendar接続テスト
      try {
        const calendarClient = new CalendarClient(session.accessToken);
        const calendarConnectionTest = await calendarClient.testConnection();
        health.services.calendar.details = {
          ...health.services.calendar.details,
          connectionTest: calendarConnectionTest
        };
        if (!calendarConnectionTest) {
          health.warnings.push('Calendar connection test failed');
        }
      } catch (error) {
        health.services.calendar.details = {
          ...health.services.calendar.details,
          connectionTest: false,
          connectionError: error instanceof Error ? error.message : String(error)
        };
        health.warnings.push(`Calendar connection error: ${error}`);
      }
    }

    // LINE接続テスト
    try {
      const lineClient = new LineClient();
      const lineConnectionTest = await lineClient.testConnection();
      health.services.line.details = {
        ...health.services.line.details,
        connectionTest: lineConnectionTest
      };
      if (!lineConnectionTest) {
        health.warnings.push('LINE connection test failed');
      }
    } catch (error) {
      health.services.line.details = {
        ...health.services.line.details,
        connectionTest: false,
        connectionError: error instanceof Error ? error.message : String(error)
      };
      health.warnings.push(`LINE connection error: ${error}`);
    }

    // 全体的な健全性を判定
    const hasErrors = health.errors.length > 0;
    const hasWarnings = health.warnings.length > 0;
    const unhealthyServices = Object.values(health.services).filter(service => service.status === 'error').length;

    if (hasErrors || unhealthyServices > 0) {
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }

    const response = createSuccessResponse(health);
    
    // HTTPステータスコードを健全性に応じて設定
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    const apiError = APIError.fromError(error);
    return NextResponse.json(createErrorResponse(apiError), { status: 500 });
  }
}

// 簡易版ヘルスチェック（認証不要）
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
} 