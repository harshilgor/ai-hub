/**
 * Test Supabase Connection
 * Verifies that Supabase is properly configured and accessible
 */

import dotenv from 'dotenv';
import { isSupabaseConfigured, supabase, papersDB, podcastsDB, channelsDB } from './services/supabaseService.js';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Check if configured
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase is NOT configured');
    console.log('   Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    console.log('\n   To configure:');
    console.log('   1. Add SUPABASE_URL=https://your-project.supabase.co');
    console.log('   2. Add SUPABASE_ANON_KEY=your-anon-key');
    console.log('   3. Restart the server');
    process.exit(1);
  }
  
  console.log('✅ Supabase client initialized');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);
  console.log(`   Key: ${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...\n`);
  
  // Test 1: Check connection
  console.log('📡 Testing connection...');
  try {
    const { data, error } = await supabase.from('papers').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Connection works, but tables not found');
        console.log('   Run the migration: backend/supabase/migrations/001_initial_schema.sql');
        console.log('   In Supabase Dashboard → SQL Editor');
      } else {
        console.error('❌ Connection error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
      }
      process.exit(1);
    }
    
    console.log('✅ Connection successful!\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  // Test 2: Check tables
  console.log('📊 Checking tables...');
  const tables = ['papers', 'podcasts', 'channels'];
  const tableStatus = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          tableStatus[table] = '❌ Table does not exist';
        } else {
          tableStatus[table] = `❌ Error: ${error.message}`;
        }
      } else {
        // Try to get count
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        tableStatus[table] = `✅ Exists (${count || 0} rows)`;
      }
    } catch (error) {
      tableStatus[table] = `❌ Error: ${error.message}`;
    }
  }
  
  console.log('\n   Table Status:');
  for (const [table, status] of Object.entries(tableStatus)) {
    console.log(`   ${table.padEnd(10)}: ${status}`);
  }
  
  // Test 3: Test database operations
  console.log('\n🧪 Testing database operations...');
  
  // Test papers
  try {
    const papers = await papersDB.getAll();
    console.log(`   Papers: ${papers ? `✅ Can read (${papers.length} papers)` : '❌ Cannot read'}`);
  } catch (error) {
    console.log(`   Papers: ❌ Error: ${error.message}`);
  }
  
  // Test podcasts
  try {
    const podcasts = await podcastsDB.getAll();
    console.log(`   Podcasts: ${podcasts ? `✅ Can read (${podcasts.length} podcasts)` : '❌ Cannot read'}`);
  } catch (error) {
    console.log(`   Podcasts: ❌ Error: ${error.message}`);
  }
  
  // Test channels
  try {
    const channels = await channelsDB.getAll();
    console.log(`   Channels: ${channels ? `✅ Can read (${channels.length} channels)` : '❌ Cannot read'}`);
  } catch (error) {
    console.log(`   Channels: ❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Supabase connection test complete!');
  console.log('\n📝 Next steps:');
  console.log('   - If tables are missing, run the migration SQL');
  console.log('   - If connection works, your backend will use Supabase automatically');
  console.log('   - Restart your server to start using Supabase');
}

testSupabaseConnection().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


