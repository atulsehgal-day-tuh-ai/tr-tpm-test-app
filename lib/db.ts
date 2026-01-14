import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:7',message:'getPool entry - checking DATABASE_URL',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:11',message:'DATABASE_URL missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Supabase and most cloud PostgreSQL providers require SSL
    const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
    const sslConfig = isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
    // #region agent log
    const connStrPreview = connectionString.split('@')[0] + '@' + (connectionString.includes('@') ? connectionString.split('@')[1].split('/')[0] : 'hidden');
    const urlParts = connectionString.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:21',message:'Pool config before creation',data:{sslConfig:sslConfig,isSupabase,connectionStringPreview:connStrPreview,nodeEnv:process.env.NODE_ENV,hasUrlParts:!!urlParts,hostPattern:urlParts?.[3]?.substring(0,20),port:urlParts?.[4],dbName:urlParts?.[5]?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000,
      max: 10,
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:20',message:'Pool created successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  }

  return pool;
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:25',message:'testDatabaseConnection entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const pool = getPool();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:28',message:'Before pool.query',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await pool.query('SELECT NOW()');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:30',message:'Query successful',data:{hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e50cdf43-d269-49e6-99d3-0563c13462a8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db.ts:33',message:'Connection error caught',data:{errorMessage:error?.message,errorCode:error?.code,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    console.error('Database connection error:', error);
    return false;
  }
}

// Initialize database with a simple test table
export async function initializeDatabase(): Promise<void> {
  try {
    const pool = getPool();
    
    // Create a simple test table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert a test record if table is empty
    const checkResult = await pool.query('SELECT COUNT(*) FROM test_table');
    if (parseInt(checkResult.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO test_table (message) VALUES ('Database connection successful!')
      `);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}