# Setting Up Your Semantic Scholar API Key

## Steps to Add Your API Key:

1. **Create a `.env` file** in the `backend` directory:
   ```
   C:\Users\harsh\Downloads\ai-hub\backend\.env
   ```

2. **Add the following content** to the `.env` file:
   ```
   PORT=3001
   SEMANTIC_SCHOLAR_API_KEY=vFeWpJHcVt7IsEsIyVJIH856flmcwTnSaYG7LX76
   ```

3. **Restart the backend server** to load the new API key

## How It Works:

- **Rate Limit**: 1 request per second (handled automatically by the code)
- **Usage**: The API key is used in all Semantic Scholar API calls
- **Headers**: Sent as `x-api-key` header in all requests

## Benefits:

✅ No more 429 rate limit errors
✅ Higher request quota
✅ More reliable paper fetching
✅ Better citation data

## Current API Key Usage:

The API key is already configured in the following functions:
- `enrichPaperWithSemanticScholar()` - Adds citation data to arXiv papers
- `searchSemanticScholar()` - Searches for papers
- `fetchLatestPapersFromSemanticScholar()` - Fetches latest AI papers
- `fetchPapersBatch()` - Batch fetches paper details
- `getPaperAutocomplete()` - Autocomplete suggestions

All functions respect the 1 req/sec rate limit automatically.

