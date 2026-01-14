import { NextResponse } from 'next/server'
import { getPool, testDatabaseConnection, initializeDatabase } from '@/lib/db'

export async function GET() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-db/route.ts:5',message:'API route entry',data:{hasDatabaseUrl:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // Test connection
    const connected = await testDatabaseConnection()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-db/route.ts:9',message:'testDatabaseConnection result',data:{connected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!connected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Initialize database (creates test table if needed)
    await initializeDatabase()

    // Query test data
    const pool = getPool()
    const result = await pool.query('SELECT * FROM test_table ORDER BY created_at DESC LIMIT 1')
    
    return NextResponse.json({
      success: true,
      message: result.rows[0]?.message || 'Database connection successful!',
      timestamp: result.rows[0]?.created_at,
    })
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/test-db/route.ts:29',message:'API error caught',data:{errorMessage:error?.message,errorCode:error?.code,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'})}).catch(()=>{});
    // #endregion
    console.error('Database API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database error occurred',
      },
      { status: 500 }
    )
  }
}