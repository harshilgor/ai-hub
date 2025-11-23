# Strategy to Get More Research Articles

## Current Status
- **arXiv**: Fetching ~100 papers every 10 minutes (all domains)
- **Semantic Scholar**: Fetching ~50 papers every 10 minutes (limited by rate limits)
- **Total**: ~150 papers per cycle, ~900 papers per hour

## Goal
Increase to **500-1000 papers per cycle** and **3000-6000 papers per hour**

---

## Strategy 1: Add New Data Sources

### 1.1 OpenAlex API (Priority: HIGH)
- **Free, no API key required**
- **200M+ papers** in database
- **REST API** with generous rate limits
- **Covers all domains**: Computer Science, Mathematics, Physics, Biology, etc.

**Implementation:**
- Endpoint: `https://api.openalex.org/works`
- Can fetch up to 10,000 papers per request
- Supports filtering by date, field, author, etc.
- No rate limits (but be respectful)

**Example Query:**
```
https://api.openalex.org/works?filter=publication_date:2024-01-01,is_oa:true&per_page=200
```

### 1.2 PubMed API (Priority: MEDIUM)
- **Free, no API key required**
- **35M+ biomedical papers**
- **REST API** (E-utilities)
- **Covers**: Medicine, Biology, Health Sciences

**Implementation:**
- Endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- Can fetch up to 10,000 papers per request
- Rate limit: 3 requests/second

### 1.3 Crossref API (Priority: MEDIUM)
- **Free, no API key required** (or optional API key for higher limits)
- **140M+ papers** with metadata
- **Covers all academic fields**
- Rate limit: 50 requests/second (with polite use)

**Implementation:**
- Endpoint: `https://api.crossref.org/works`
- Can fetch up to 1,000 papers per request
- Excellent metadata (DOIs, citations, abstracts)

---

## Strategy 2: Optimize Current Sources

### 2.1 Increase arXiv Fetch Limits
**Current:** 100 papers per fetch
**Target:** 200-500 papers per fetch

**Changes:**
- Increase `maxResults` parameter
- Use multiple category queries in parallel
- Fetch from more arXiv categories simultaneously

### 2.2 Use Semantic Scholar Bulk Endpoints
**Current:** 5 queries × ~10 papers each = ~50 papers
**Target:** Use bulk search with continuation tokens = 1,000+ papers

**Changes:**
- Use `/paper/search` with `limit=1000` (max per request)
- Implement pagination with continuation tokens
- Fetch up to 10,000 papers per cycle (if needed)

### 2.3 Implement Pagination
**Current:** Single request per source
**Target:** Multiple paginated requests

**For arXiv:**
- Use `start` parameter to paginate
- Fetch 200 papers per request, make 5 requests = 1,000 papers

**For Semantic Scholar:**
- Use continuation tokens from API response
- Fetch multiple pages sequentially

---

## Strategy 3: Increase Fetch Frequency

### 3.1 Reduce Update Interval
**Current:** Every 10 minutes
**Options:**
- **5 minutes**: 2x more papers (1,800/hour)
- **3 minutes**: 3.3x more papers (3,000/hour)
- **1 minute**: 10x more papers (9,000/hour) ⚠️ May hit rate limits

**Recommendation:** Start with **5 minutes**, monitor rate limits

### 3.2 Increase Papers Per Cycle
**Current:** ~150 papers per cycle
**Target:** 500-1,000 papers per cycle

**Breakdown:**
- arXiv: 300-500 papers
- Semantic Scholar: 200-300 papers (with rate limiting)
- OpenAlex: 200-500 papers
- PubMed: 100-200 papers (if added)
- **Total: 800-1,500 papers per cycle**

---

## Strategy 4: Better Query Strategies

### 4.1 More Diverse arXiv Queries
**Current:** Using broad category search
**Enhancement:**
- Query by specific subcategories
- Use date-based queries
- Query by author (top researchers)
- Use keyword combinations

### 4.2 Semantic Scholar Query Expansion
**Current:** 5 queries per cycle
**Enhancement:**
- Expand to 10-15 queries
- Use field-specific queries (NLP, CV, RL, etc.)
- Query by venue (NeurIPS, ICML, ICLR, etc.)
- Use year-based queries

### 4.3 OpenAlex Field Queries
- Query by field (Computer Science, Mathematics, etc.)
- Query by open access status
- Query by publication type
- Query by date ranges

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Increase arXiv fetch limit to 200 papers
2. ✅ Add more arXiv category queries
3. ✅ Implement arXiv pagination (2-3 pages)
4. ✅ Reduce update interval to 5 minutes

**Expected Result:** 400-600 papers per cycle

### Phase 2: Add OpenAlex (2-3 hours)
1. Create `openAlexService.js`
2. Implement `fetchLatestPapersFromOpenAlex()`
3. Integrate into `updatePapers()` function
4. Add OpenAlex source tracking

**Expected Result:** 600-1,000 papers per cycle

### Phase 3: Optimize Semantic Scholar (1-2 hours)
1. Implement continuation token pagination
2. Increase query limit to 1,000 per request
3. Use bulk endpoints where possible
4. Better rate limit handling

**Expected Result:** 800-1,500 papers per cycle

### Phase 4: Add PubMed (Optional, 2-3 hours)
1. Create `pubmedService.js`
2. Implement `fetchLatestPapersFromPubMed()`
3. Integrate into update cycle
4. Add biomedical paper filtering

**Expected Result:** 1,000-2,000 papers per cycle

### Phase 5: Add Crossref (Optional, 2-3 hours)
1. Create `crossrefService.js`
2. Implement `fetchLatestPapersFromCrossref()`
3. Use for metadata enrichment
4. Fill gaps from other sources

**Expected Result:** 1,200-2,500 papers per cycle

---

## Technical Considerations

### Rate Limits
- **arXiv**: No official limit (be respectful, ~1 req/sec)
- **Semantic Scholar**: 1 req/sec (with API key)
- **OpenAlex**: No limit (be respectful, ~10 req/sec)
- **PubMed**: 3 req/sec
- **Crossref**: 50 req/sec (with polite use)

### Deduplication
- Need robust deduplication across all sources
- Check by: arXiv ID, DOI, Semantic Scholar ID, normalized title
- Handle papers that appear in multiple sources

### Storage
- Current cache limit: 10,000 papers
- May need to increase to 50,000-100,000 papers
- Consider database migration if needed

### Performance
- Parallel fetching from multiple sources
- Use `Promise.allSettled()` for resilience
- Implement retry logic for failed requests
- Cache results to avoid redundant requests

---

## Expected Results

### Before Optimization
- **Papers per cycle:** ~150
- **Papers per hour:** ~900
- **Papers per day:** ~21,600

### After Phase 1 (Quick Wins)
- **Papers per cycle:** 400-600
- **Papers per hour:** 4,800-7,200
- **Papers per day:** 115,200-172,800

### After Phase 2 (OpenAlex)
- **Papers per cycle:** 600-1,000
- **Papers per hour:** 7,200-12,000
- **Papers per day:** 172,800-288,000

### After Phase 3 (Optimized Semantic Scholar)
- **Papers per cycle:** 800-1,500
- **Papers per hour:** 9,600-18,000
- **Papers per day:** 230,400-432,000

### After All Phases
- **Papers per cycle:** 1,200-2,500
- **Papers per hour:** 14,400-30,000
- **Papers per day:** 345,600-720,000

---

## Next Steps

1. **Review this plan** and prioritize phases
2. **Start with Phase 1** (quick wins)
3. **Monitor rate limits** and adjust accordingly
4. **Test deduplication** with larger volumes
5. **Scale storage** if needed

---

## Notes

- All APIs mentioned are **free** and **open access**
- No API keys required for most (except Semantic Scholar, which we already have)
- Be respectful of rate limits to avoid getting blocked
- Monitor server resources (memory, CPU) as volume increases
- Consider implementing a queue system for very high volumes


