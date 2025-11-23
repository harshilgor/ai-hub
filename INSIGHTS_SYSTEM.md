# AI-Powered Insights System

## Overview
A comprehensive insights system that aggregates data from multiple sources (research papers, news articles, patents, GitHub, podcasts) to predict next big technologies and identify growing industries.

## Architecture

### Data Sources
1. **Research Papers** (Existing)
   - arXiv
   - Semantic Scholar
   - OpenAlex

2. **News Articles** (New)
   - Google News RSS
   - Hacker News API

3. **Patents** (New)
   - PatentsView API

4. **GitHub** (New)
   - GitHub Trending Repositories API

5. **Podcasts** (New)
   - Transcript processing service (placeholder for future integration)

6. **Job Postings** (New)
   - Placeholder for future API integration

### Services Created

#### `backend/services/newsService.js`
- Fetches tech news from Google News and Hacker News
- Extracts technologies and industries from content
- Performs sentiment analysis
- Rate limiting: 2 requests/second

#### `backend/services/patentService.js`
- Fetches patents from PatentsView API
- Extracts technologies and industries
- Rate limiting: 1 request/second

#### `backend/services/githubService.js`
- Fetches trending repositories
- Extracts technologies from repo descriptions
- Rate limiting: 0.5 requests/second (respects GitHub limits)

#### `backend/services/podcastService.js`
- Processes podcast transcripts
- Extracts key quotes about technology predictions
- Identifies speaker information

#### `backend/services/jobPostingService.js`
- Placeholder for job posting API integration
- Structure ready for LinkedIn, Indeed, or Adzuna APIs

#### `backend/services/aggregationService.js`
- Combines signals from all sources
- Extracts unique technologies and industries
- Provides unified data access

#### `backend/services/insightEngine.js`
- **Technology Momentum**: Calculates momentum score based on velocity and acceleration
- **Industry Growth**: Calculates growth rates and scores
- **Predictions**: Predicts next big technologies using multiple factors
- **Emerging Detection**: Identifies early-stage technologies
- **Leader Quotes**: Extracts key insights from podcasts
- **Signal Strength**: Combines signals across all sources

### API Endpoints

#### `/api/insights/technologies`
- Returns technology momentum scores
- Parameters: `timeWindow` (default: 30 days)
- Response: Array of technologies with momentum, velocity, confidence, signal counts

#### `/api/insights/industries`
- Returns industry growth rankings
- Parameters: `timeWindow` (default: 90 days)
- Response: Array of industries with growth rates, scores, monthly trends

#### `/api/insights/emerging`
- Returns emerging technologies
- Parameters: `timeWindow` (default: 30 days)
- Response: Top 20 emerging technologies with scores and confidence

#### `/api/insights/predictions`
- Returns next big technology predictions
- Response: Top 10 predictions with scores, momentum, early-stage indicators

#### `/api/insights/leader-quotes`
- Returns key quotes from podcasts
- Response: Top quotes with technologies and sources

#### `/api/insights/combined-signal`
- Returns combined signal strength for a specific technology
- Parameters: `technology` (required)
- Response: Total signal strength and source breakdown

### Frontend Components

#### `src/components/InsightsSection.tsx`
- Displays next big technologies
- Shows emerging technologies
- Lists top growing industries
- Displays leader quotes

#### `src/pages/HomePage.tsx`
- Integrated InsightsSection component
- Shows AI-powered insights at the top of the page

### Scheduled Jobs

- **Every 6 hours**: Refreshes insights data (news, patents, GitHub)
- **Every 10 minutes**: Updates research papers (existing)

### Data Flow

1. **Data Collection**: Services fetch data from APIs
2. **Normalization**: All data converted to unified format
3. **Technology Extraction**: NLP extracts technologies and industries
4. **Signal Aggregation**: All signals combined
5. **Insight Calculation**: Engine calculates momentum, growth, predictions
6. **Caching**: Results cached for 6 hours
7. **API Serving**: Endpoints serve calculated insights
8. **Frontend Display**: React components display insights

### Key Algorithms

#### Technology Momentum
```
momentum = (
  paperVelocity * 0.3 +
  patentVelocity * 0.25 +
  newsVelocity * 0.2 +
  podcastVelocity * 0.15 +
  githubVelocity * 0.1
) * confidenceMultiplier
```

#### Industry Growth
```
growthScore = (
  researchVolume * 0.3 +
  patentActivity * 0.25 +
  fundingTrend * 0.2 +
  jobPostings * 0.15 +
  newsCoverage * 0.1
) * timeDecayFactor
```

#### Prediction Score
```
predictionScore = (
  momentum * 0.4 +
  earlyStageBonus * 0.2 +
  leaderMentions * 0.2 +
  patentActivity * 0.2
)
```

### Future Enhancements

1. **Podcast Integration**: Add YouTube Transcript API or podcast databases
2. **Job Postings**: Integrate LinkedIn/Indeed APIs
3. **Advanced NLP**: Use BERT/LLM for better technology extraction
4. **Machine Learning**: Train models for better predictions
5. **Real-time Updates**: WebSocket support for live insights
6. **Historical Analysis**: Track technology lifecycles
7. **Correlation Analysis**: Find relationships between technologies

### Usage

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `npm run dev`
3. **View Insights**: Navigate to Home page to see insights section
4. **API Access**: Use `/api/insights/*` endpoints for programmatic access

### Notes

- Rate limits are implemented for all external APIs
- Data is cached to reduce API calls
- Error handling ensures system continues even if one source fails
- All services are modular and can be extended independently

