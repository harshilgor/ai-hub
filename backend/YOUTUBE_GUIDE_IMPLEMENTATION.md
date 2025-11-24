# YouTube Video Fetching - Guide Implementation

## Overview
This implementation follows the comprehensive guide for fetching YouTube videos and analyzing transcripts. The system has been rebuilt to use the **uploads playlist method** instead of the search API, which is more reliable and can fetch all videos from a channel.

## Implementation Steps (Following the Guide)

### Step 1: Set Up YouTube Data API Access ✅
- Already configured with `YOUTUBE_API_KEY` in `.env`
- Using `googleapis` library for API access

### Step 2: Get the Channel's Upload Playlist ID ✅
**Function**: `getUploadsPlaylistId(channelId)`

- Uses `channels.list` endpoint with `part=contentDetails`
- Extracts `relatedPlaylists.uploads` from the response
- The uploads playlist ID typically looks like the channel ID but with "UU" instead of "UC"

**Example**:
```javascript
const response = await youtube.channels.list({
  part: 'contentDetails',
  id: actualChannelId
});
const uploadsPlaylistId = response.data.items[0].contentDetails.relatedPlaylists.uploads;
```

### Step 3: Fetch All Videos from the Uploads Playlist ✅
**Function**: `getAllVideoIdsFromPlaylist(playlistId, maxResults)`

- Uses `playlistItems.list` endpoint
- Handles pagination using `nextPageToken`
- Returns up to 50 items per page (API limit)
- Iterates through all pages to get complete list

**Key Features**:
- Pagination support (handles `nextPageToken`)
- Rate limiting between pages
- Extracts `videoId` from each playlist item

### Step 4: Extract Transcripts from Videos ✅
**Function**: `fetchYouTubeTranscript(videoId)` in `podcastService.js`

Uses multiple methods in order:
1. **Direct timedtext endpoint** - Fastest if captions exist
2. **Web scraping** - Extracts caption track URL from page
3. **youtube-transcript library** - Node.js equivalent of Python's youtube-transcript-api
4. **OpenAI Whisper API** - Speech-to-text fallback (works even without captions)

### Step 5: Process and Analyze Transcripts ✅
**Function**: `processPodcastTranscript(transcriptText, metadata)`

The system automatically:
- Parses transcripts into segments
- Extracts technologies, companies, and entities
- Analyzes sentiment and stance
- Generates key quotes and insights
- Creates stance distribution

## Key Improvements Over Previous Implementation

### Before (Using search.list):
- ❌ Limited to recent videos only
- ❌ Couldn't fetch all videos from a channel
- ❌ Less reliable for getting complete video lists
- ❌ Limited filtering options

### After (Using uploads playlist):
- ✅ Can fetch ALL videos from a channel
- ✅ More reliable and complete
- ✅ Better pagination support
- ✅ Follows YouTube's recommended approach
- ✅ Can filter by date more effectively

## API Endpoints Used

1. **channels.list** - Get channel details and uploads playlist ID
   ```
   GET /youtube/v3/channels?part=contentDetails&id={CHANNEL_ID}
   ```

2. **playlistItems.list** - Get videos from uploads playlist
   ```
   GET /youtube/v3/playlistItems?part=contentDetails&playlistId={PLAYLIST_ID}&maxResults=50
   ```

3. **videos.list** - Get detailed video information
   ```
   GET /youtube/v3/videos?part=contentDetails,snippet,statistics&id={VIDEO_ID1},{VIDEO_ID2},...
   ```

## Usage Example

```javascript
// Fetch videos from a channel
const videos = await fetchChannelVideos('UCX14i9dYBrFOabk0xGmbkRA', 10);

// Each video will be automatically processed:
// 1. Transcript fetched (using multiple fallback methods)
// 2. Transcript analyzed for insights
// 3. Results stored in database
```

## Error Handling

- Handles channel not found errors
- Handles private/unavailable videos
- Handles API rate limits
- Provides detailed error logging
- Gracefully handles missing transcripts

## Rate Limiting

- 100ms delay between playlist pages
- 100ms delay between video detail batches
- 2 seconds between video processing (in checkChannelForNewVideos)

## Next Steps

The system now:
1. ✅ Properly fetches all videos using uploads playlist
2. ✅ Uses multiple transcript methods (including Whisper API)
3. ✅ Processes and analyzes transcripts automatically
4. ✅ Stores insights in the database

To test:
1. Restart the backend server
2. The system will automatically fetch videos from configured channels
3. Check logs to see the uploads playlist method in action
4. Videos will be processed with transcripts and insights generated

