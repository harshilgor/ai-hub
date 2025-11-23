import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'papers.json');

/**
 * Clear the entire database and reset to empty state
 */
async function clearDatabase() {
  try {
    console.log('🧹 Clearing entire database...');
    
    // Create empty database structure
    const emptyDatabase = {
      papers: [],
      lastFetchTime: null,
      industryStats: {},
      lastPaperDate: null,
      oldestPaperDate: null
    };
    
    // Write empty database
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDatabase, null, 2));
    
    console.log('✅ Database cleared successfully!');
    console.log('📊 New database state:');
    console.log(`   Papers: 0`);
    console.log(`   Last fetch time: null`);
    console.log(`   Date range: null to null`);
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. The server will start fetching papers from scratch');
    console.log('   3. Papers will be fetched from: arXiv, Semantic Scholar, OpenAlex');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run cleanup
clearDatabase();

