/**
 * YouTube Channel Service - Fetches videos from YouTube channels
 */

import { google } from 'googleapis';
import { processYouTubeVideo } from './podcastService.js';

// Initialize YouTube API
let youtube = null;

function initializeYouTubeAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ YOUTUBE_API_KEY not set. Channel fetching will be disabled.');
    return null;
  }
  
  youtube = google.youtube({
    version: 'v3',
    auth: apiKey
  });
  
  return youtube;
}

/**
 * Extract channel ID from various YouTube URL formats
 */
export function extractChannelId(channelInput) {
  // Handle different formats:
  // - Channel ID: UC_x5XG1OV2P6uZZ5FSM9Ttw
  // - Channel URL: https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw
  // - Channel handle: @lexfridman
  // - Channel URL with handle: https://www.youtube.com/@lexfridman
  
  if (!channelInput) return null;
  
  // If it's already a channel ID (starts with UC)
  if (channelInput.startsWith('UC') && channelInput.length === 24) {
    return channelInput;
  }
  
  // Extract from URL
  const urlPatterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of urlPatterns) {
    const match = channelInput.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // If it's a handle (starts with @)
  if (channelInput.startsWith('@')) {
    return channelInput.substring(1);
  }
  
  return channelInput;
}

/**
 * Get channel ID from handle/username
 */
async function getChannelIdFromHandle(handle) {
  try {
    if (!youtube) initializeYouTubeAPI();
    if (!youtube) return null;
    
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    
    // Try using channels.list with forHandle (newer API)
    try {
      const response = await youtube.channels.list({
        part: 'id',
        forHandle: cleanHandle
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id;
      }
    } catch (handleError) {
      // If forHandle doesn't work, fall back to search
      console.log(`   forHandle not available, trying search for: ${cleanHandle}`);
    }
    
    // Fallback: Use search to find channel
    const searchResponse = await youtube.search.list({
      part: 'snippet',
      q: cleanHandle,
      type: 'channel',
      maxResults: 5
    });
    
    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      // Find exact match by handle
      for (const item of searchResponse.data.items) {
        const customUrl = item.snippet.customUrl;
        const title = item.snippet.title.toLowerCase();
        const handleLower = cleanHandle.toLowerCase();
        
        // Check if custom URL or title matches
        if (customUrl && customUrl.toLowerCase() === handleLower) {
          return item.snippet.channelId;
        }
        if (title.includes(handleLower) || handleLower.includes(title.split(' ')[0])) {
          return item.snippet.channelId;
        }
      }
      
      // If no exact match, return first result
      return searchResponse.data.items[0].snippet.channelId;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting channel ID from handle:', error.message);
    return null;
  }
}

/**
 * Parse YouTube duration (PT1H2M10S format) to seconds
 */
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get channel's uploads playlist ID
 * Following the guide: Step 2 - Get the Channel's Upload Playlist ID
 */
async function getUploadsPlaylistId(channelId) {
  try {
    if (!youtube) initializeYouTubeAPI();
    if (!youtube) {
      throw new Error('YouTube API not initialized. Set YOUTUBE_API_KEY in .env');
    }
    
    // If channelId looks like a handle, get the actual channel ID first
    let actualChannelId = channelId;
    const isChannelId = channelId.startsWith('UC') && channelId.length === 24;
    
    if (!isChannelId) {
      console.log(`   Resolving handle to channel ID: ${channelId}`);
      actualChannelId = await getChannelIdFromHandle(channelId);
      if (!actualChannelId) {
        throw new Error(`Could not find channel ID for: ${channelId}`);
      }
      console.log(`   Resolved to channel ID: ${actualChannelId}`);
    }
    
    // Get channel details including uploads playlist
    // Following guide: Use channels.list endpoint with part=contentDetails
    const response = await youtube.channels.list({
      part: 'contentDetails',
      id: actualChannelId
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error(`Channel not found: ${actualChannelId}`);
    }
    
    const uploadsPlaylistId = response.data.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`   Uploads Playlist ID: ${uploadsPlaylistId}`);
    
    return uploadsPlaylistId;
  } catch (error) {
    console.error('Error getting uploads playlist ID:', error.message);
    throw error;
  }
}

/**
 * Fetch all videos from the uploads playlist
 * Following the guide: Step 3 - Fetch All Videos from the Uploads Playlist
 */
async function getAllVideoIdsFromPlaylist(playlistId, maxResults = 50) {
  try {
    if (!youtube) initializeYouTubeAPI();
    if (!youtube) {
      throw new Error('YouTube API not initialized');
    }
    
    const videoIds = [];
    let nextPageToken = null;
    
    // The API returns results in pages of up to 50 items
    // We need to iterate through pages using nextPageToken
    while (true) {
      const params = {
        part: 'contentDetails',
        playlistId: playlistId,
        maxResults: Math.min(maxResults, 50) // API max is 50
      };
      
      if (nextPageToken) {
        params.pageToken = nextPageToken;
      }
      
      const response = await youtube.playlistItems.list(params);
      
      if (!response.data.items || response.data.items.length === 0) {
        break;
      }
      
      // Extract video IDs
      for (const item of response.data.items) {
        if (item.contentDetails && item.contentDetails.videoId) {
          videoIds.push(item.contentDetails.videoId);
        }
      }
      
      // Check if there are more pages
      nextPageToken = response.data.nextPageToken;
      if (!nextPageToken) {
        break;
      }
      
      // Rate limiting: wait a bit between pages
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return videoIds;
  } catch (error) {
    console.error('Error fetching video IDs from playlist:', error.message);
    throw error;
  }
}

/**
 * Check if a video is a YouTube Short
 * Shorts are typically < 60 seconds or have "Shorts" in title/description
 */
function isShortVideo(video) {
  // Check duration - shorts are typically < 60 seconds
  if (video.duration < 60) {
    return true;
  }
  
  // Check title/description for "Shorts" indicator
  const title = (video.title || '').toLowerCase();
  const description = (video.description || '').toLowerCase();
  
  if (title.includes('#shorts') || description.includes('#shorts')) {
    return true;
  }
  
  return false;
}

/**
 * Fetch recent videos from a YouTube channel
 * Filters out Shorts and only returns regular videos (>= 5 minutes)
 * Continues fetching until we have enough regular videos
 */
export async function fetchChannelVideos(channelId, maxResults = 5, publishedAfter = null, minVideoLength = 300) {
  try {
    if (!youtube) initializeYouTubeAPI();
    if (!youtube) {
      throw new Error('YouTube API not initialized. Set YOUTUBE_API_KEY in .env');
    }
    
    console.log(`📹 Fetching videos from channel: ${channelId}`);
    console.log(`   Filtering out Shorts and videos < ${Math.floor(minVideoLength / 60)} minutes`);
    
    // Step 1: Get uploads playlist ID
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
    
    // Step 2: Fetch and process videos in batches until we have enough regular videos
    const regularVideos = [];
    let shortsSkipped = 0;
    let tooShortSkipped = 0;
    let processedCount = 0;
    let nextPageToken = null;
    const maxBatches = 20; // Process up to 20 batches (1000 videos) to find enough regular videos
    let batchCount = 0;
    
    while (regularVideos.length < maxResults && batchCount < maxBatches) {
      batchCount++;
      
      // Fetch a batch of video IDs from playlist
      console.log(`   Fetching video batch ${batchCount}/${maxBatches}...`);
      const playlistParams = {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 50 // API max is 50
      };
      
      if (nextPageToken) {
        playlistParams.pageToken = nextPageToken;
      }
      
      const playlistResponse = await youtube.playlistItems.list(playlistParams);
      
      if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
        console.log(`   No more videos in playlist`);
        break;
      }
      
      // Extract video IDs from this batch
      const videoIds = [];
      for (const item of playlistResponse.data.items) {
        if (item.contentDetails && item.contentDetails.videoId) {
          videoIds.push(item.contentDetails.videoId);
        }
      }
      
      if (videoIds.length === 0) {
        nextPageToken = playlistResponse.data.nextPageToken;
        continue;
      }
      
      console.log(`   Getting details for ${videoIds.length} videos...`);
      
      // Get video details for this batch
      const detailsResponse = await youtube.videos.list({
        part: 'contentDetails,snippet,statistics',
        id: videoIds.join(',')
      });
      
      if (!detailsResponse.data.items || detailsResponse.data.items.length === 0) {
        console.log(`   ⚠️ No video details returned for this batch`);
        nextPageToken = playlistResponse.data.nextPageToken;
        continue;
      }
      
      // Process each video in this batch
      for (const item of detailsResponse.data.items) {
        processedCount++;
        
        const publishedAt = new Date(item.snippet.publishedAt);
        
        // No date filtering - we want all videos regardless of publish date
        // (Date filtering removed per user request to fetch all videos)
        
        const duration = parseDuration(item.contentDetails?.duration || 'PT0S');
        
        const video = {
          videoId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.default?.url || 
                     item.snippet.thumbnails?.medium?.url || 
                     item.snippet.thumbnails?.high?.url || '',
          channelTitle: item.snippet.channelTitle,
          duration: duration,  // in seconds
          viewCount: parseInt(item.statistics?.viewCount || 0)
        };
        
        // Skip Shorts
        if (isShortVideo(video)) {
          shortsSkipped++;
          console.log(`   ⏭️ Skipping Short: "${video.title.substring(0, 50)}..." (${Math.floor(video.duration)}s)`);
          continue;
        }
        
        // Skip videos that are too short (less than minVideoLength)
        if (duration < minVideoLength) {
          tooShortSkipped++;
          console.log(`   ⏭️ Skipping video "${video.title.substring(0, 50)}..." - too short (${Math.floor(duration / 60)}m ${duration % 60}s < ${Math.floor(minVideoLength / 60)}m)`);
          continue;
        }
        
        // This is a regular video that meets our criteria
        regularVideos.push(video);
        console.log(`   ✅ Found regular video: "${video.title.substring(0, 50)}..." (${Math.floor(duration / 60)}m ${duration % 60}s)`);
        
        // Stop if we have enough videos
        if (regularVideos.length >= maxResults) {
          break;
        }
      }
      
      // Get next page token for next iteration
      nextPageToken = playlistResponse.data.nextPageToken;
      
      if (!nextPageToken) {
        console.log(`   No more pages in playlist`);
        break;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (regularVideos.length >= maxResults) {
        break;
      }
    }
    
    // Sort by published date (newest first)
    regularVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Limit to maxResults
    const result = regularVideos.slice(0, maxResults);
    
    console.log(`   ✅ Returning ${result.length} regular videos`);
    console.log(`   📊 Stats: ${processedCount} processed, ${shortsSkipped} Shorts skipped, ${tooShortSkipped} too short, ${result.length} regular videos found`);
    
    return result;
  } catch (error) {
    console.error('Error fetching channel videos:', error.message);
    if (error.response) {
      console.error('YouTube API Error:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Check channel for new videos and process them
 */
export async function checkChannelForNewVideos(channelConfig, processedVideoIds, podcastsCache) {
  try {
    console.log(`🔍 Checking channel: ${channelConfig.name} (${channelConfig.channelId})`);
    
    // Fetch videos without date filtering - get all videos regardless of publish date
    // We'll filter by processedVideoIds instead to avoid reprocessing
    console.log('   Fetching videos from all time periods (no date filter)');
    
    // Fetch recent videos (will filter out Shorts and videos < 5 minutes)
    let videos;
    try {
      const minVideoLength = channelConfig.minVideoLength || 300; // 5 minutes default
      videos = await fetchChannelVideos(
        channelConfig.channelId,
        channelConfig.maxVideosPerCheck || 5,
        null, // No date filter - fetch all videos
        minVideoLength // Pass minVideoLength to filter during fetch
      );
    } catch (fetchError) {
      console.error(`   Error fetching videos: ${fetchError.message}`);
      console.error(`   Stack: ${fetchError.stack}`);
      return { processed: 0, skipped: 0, errors: 1, videos: [], error: fetchError.message };
    }
    
    if (videos.length === 0) {
      console.log(`   No new videos found`);
      return { processed: 0, skipped: 0, errors: 0, videos: [] };
    }
    
    // Filter out already processed videos
    const newVideos = videos.filter(v => 
      !processedVideoIds.includes(v.videoId)
    );
    
    if (newVideos.length === 0) {
      console.log(`   All ${videos.length} videos already processed`);
      return { processed: 0, skipped: videos.length, errors: 0, videos: [] };
    }
    
    console.log(`   Found ${newVideos.length} new videos (${videos.length - newVideos.length} already processed)`);
    
    // Videos are already filtered for length and Shorts during fetch
    // So all videos in newVideos should be valid regular videos >= 5 minutes
    const videosToProcess = newVideos;
    
    if (videosToProcess.length === 0) {
      console.log(`   No new regular videos to process`);
      return { processed: 0, skipped: newVideos.length, errors: 0, videos: [] };
    }
    
    console.log(`   Processing ${videosToProcess.length} regular videos (all >= 5 minutes, Shorts already filtered)`);
    
    // Process each new video
    let processed = 0;
    let errors = 0;
    const processedPodcasts = [];
    
    for (const video of videosToProcess) {
      try {
        console.log(`   Processing: ${video.title}`);
        
        const processedPodcast = await processYouTubeVideo(video.videoId, {
          title: video.title,
          published: video.publishedAt,
          source: 'YouTube',
          sourceId: 'youtube',
          link: `https://www.youtube.com/watch?v=${video.videoId}`,
          podcast: channelConfig.name,
          episode: video.title
        });
        
        if (processedPodcast) {
          processed++;
          processedVideoIds.push(video.videoId);
          processedPodcasts.push(processedPodcast);
          
          // Add to podcasts cache if provided
          if (podcastsCache) {
            const existingIndex = podcastsCache.findIndex(p => p.id === processedPodcast.id);
            if (existingIndex >= 0) {
              podcastsCache[existingIndex] = processedPodcast;
            } else {
              podcastsCache.push(processedPodcast);
            }
          }
        } else {
          errors++;
        }
        
        // Rate limiting: wait 2 seconds between videos
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`   Error processing video ${video.videoId}:`, error.message);
        errors++;
      }
    }
    
    return { processed, skipped: videos.length - newVideos.length, errors, videos: processedPodcasts };
  } catch (error) {
    console.error(`Error checking channel ${channelConfig.name}:`, error.message);
    return { processed: 0, skipped: 0, errors: 1, videos: [] };
  }
}

