import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'papers.json');

async function verifySources() {
  try {
    console.log('🔍 Verifying database sources...\n');
    
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    const papers = parsed.papers || [];
    
    console.log(`📊 Total papers in database: ${papers.length}\n`);
    
    // Count by source
    const sources = {};
    papers.forEach(p => {
      const src = p.sourceId || 'unknown';
      sources[src] = (sources[src] || 0) + 1;
    });
    
    console.log('📊 Source breakdown:');
    Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .forEach(([src, count]) => {
        console.log(`   ${src}: ${count}`);
      });
    
    // Check for removed sources
    const removedSources = ['crossref', 'pubmed', 'dblp'];
    const foundRemoved = removedSources.filter(src => sources[src] > 0);
    
    console.log('\n🔍 Checking for removed sources...');
    if (foundRemoved.length === 0) {
      console.log('✅ SUCCESS: No papers from removed sources (Crossref, PubMed, DBLP) found!');
    } else {
      console.log('❌ ERROR: Found papers from removed sources:');
      foundRemoved.forEach(src => {
        console.log(`   - ${src}: ${sources[src]} papers`);
      });
    }
    
    // Verify valid sources
    const validSources = ['arxiv', 'semantic-scholar', 'openalex'];
    const invalidSources = Object.keys(sources).filter(src => !validSources.includes(src) && src !== 'unknown');
    
    console.log('\n🔍 Checking for invalid sources...');
    if (invalidSources.length === 0) {
      console.log('✅ SUCCESS: All sources are valid!');
    } else {
      console.log('⚠️  WARNING: Found invalid sources:');
      invalidSources.forEach(src => {
        console.log(`   - ${src}: ${sources[src]} papers`);
      });
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Total papers: ${papers.length}`);
    console.log(`   Valid sources: ${validSources.join(', ')}`);
    console.log(`   Papers from valid sources: ${validSources.reduce((sum, src) => sum + (sources[src] || 0), 0)}`);
    
    if (foundRemoved.length === 0 && invalidSources.length === 0) {
      console.log('\n✅ All checks passed! Database is clean and ready.');
    } else {
      console.log('\n❌ Some issues found. Please review the output above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

verifySources();

