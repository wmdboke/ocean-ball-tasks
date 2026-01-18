import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// 使用 Edge Runtime 以获得更快的冷启动
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 验证请求来自 Vercel Cron
    const authHeader = request.headers.get('authorization');

    // 在生产环境验证 CRON_SECRET
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.CRON_SECRET) {
        console.error('CRON_SECRET is not configured');
        return Response.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error('Unauthorized cron request');
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // 执行简单查询以保持 Supabase 数据库活跃
    const result = await db.execute(sql`SELECT NOW() as current_time`);

    console.log('Keep-alive cron executed successfully at:', new Date().toISOString());

    return Response.json({
      success: true,
      message: 'Database keep-alive ping successful',
      timestamp: new Date().toISOString(),
      result: result.rows[0]
    });

  } catch (error) {
    console.error('Keep-alive cron error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
