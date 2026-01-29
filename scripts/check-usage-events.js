#!/usr/bin/env node
const { Client } = require('pg');

async function checkTable() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected\n');
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'usage_events'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current usage_events columns:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTable();
