import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'papers.json');

async function verifyAndReport() {
  try {
    // Verify database
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    const papers = parsed.papers || [];
    
    const crossref = papers.filter(p => p.sourceId === 'crossref').length;
    const pubmed = papers.filter(p => p.sourceId === 'pubmed').length;
    const dblp = papers.filter(p => p.sourceId === 'dblp').length;
    
    console.log('📊 Database Status:');
    console.log(`   Total papers: ${papers.length}`);
    console.log(`   Crossref: ${crossref}`);
    console.log(`   PubMed: ${pubmed}`);
    console.log(`   DBLP: ${dblp}`);
    console.log(`   Removed sources total: ${crossref + pubmed + dblp}`);
    
    if (crossref + pubmed + dblp === 0) {
      console.log('\n✅ Database is clean!');
      console.log('\n⚠️  IMPORTANT: The server needs to be restarted to load the cleaned database.');
      console.log('   The in-memory cache still has the old count (507 papers).');
      console.log('   After restart, it will show the correct count (400 papers).');
    } else {
      console.log('\n❌ Database still contains papers from removed sources!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyAndReport();

