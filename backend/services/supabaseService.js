/**
 * Supabase Database Service
 * Handles all database operations for papers, podcasts, and channels
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found. Using JSON file storage as fallback.');
  console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY in .env to use Supabase');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured() {
  return supabase !== null;
}

/**
 * Papers Table Operations
 */
export const papersDB = {
  /**
   * Get all papers
   */
  async getAll() {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .order('published', { ascending: false });
    
    if (error) {
      console.error('Error fetching papers from Supabase:', error);
      return null;
    }
    
    return data || [];
  },
  
  /**
   * Insert or update papers
   */
  async upsert(papers) {
    if (!supabase || !papers || papers.length === 0) return false;
    
    const { error } = await supabase
      .from('papers')
      .upsert(papers, { onConflict: 'id' });
    
    if (error) {
      console.error('Error upserting papers to Supabase:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get paper by ID
   */
  async getById(id) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching paper from Supabase:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Search papers
   */
  async search(query, limit = 100) {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .limit(limit)
      .order('published', { ascending: false });
    
    if (error) {
      console.error('Error searching papers in Supabase:', error);
      return [];
    }
    
    return data || [];
  }
};

/**
 * Podcasts Table Operations
 */
export const podcastsDB = {
  /**
   * Get all podcasts
   */
  async getAll() {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .order('published', { ascending: false });
    
    if (error) {
      console.error('Error fetching podcasts from Supabase:', error);
      return null;
    }
    
    // Parse metadata and breakdown JSON for all podcasts
    if (data) {
      return data.map(podcast => {
        // Parse metadata
        if (podcast.metadata) {
          try {
            podcast.metadata = typeof podcast.metadata === 'string' 
              ? JSON.parse(podcast.metadata) 
              : podcast.metadata;
          } catch (e) {
            console.error('Error parsing podcast metadata:', e);
          }
        }
        
        // Parse breakdown
        if (podcast.breakdown) {
          try {
            podcast.breakdown = typeof podcast.breakdown === 'string' 
              ? JSON.parse(podcast.breakdown) 
              : podcast.breakdown;
          } catch (e) {
            console.error('Error parsing podcast breakdown:', e);
          }
        }
        
        return podcast;
      });
    }
    
    return [];
  },
  
  /**
   * Insert or update podcasts
   */
  async upsert(podcasts) {
    if (!supabase || !podcasts || podcasts.length === 0) return false;
    
    // Convert metadata and breakdown to JSON for storage
    const podcastsToInsert = podcasts.map(podcast => ({
      ...podcast,
      metadata: typeof podcast.metadata === 'string' 
        ? podcast.metadata 
        : JSON.stringify(podcast.metadata || {}),
      breakdown: podcast.breakdown 
        ? (typeof podcast.breakdown === 'string' 
            ? podcast.breakdown 
            : JSON.stringify(podcast.breakdown))
        : null
    }));
    
    const { error } = await supabase
      .from('podcasts')
      .upsert(podcastsToInsert, { onConflict: 'id' });
    
    if (error) {
      console.error('Error upserting podcasts to Supabase:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get podcast by ID
   */
  async getById(id) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching podcast from Supabase:', error);
      return null;
    }
    
    // Parse metadata JSON
    if (data && data.metadata) {
      try {
        data.metadata = typeof data.metadata === 'string' 
          ? JSON.parse(data.metadata) 
          : data.metadata;
      } catch (e) {
        console.error('Error parsing podcast metadata:', e);
      }
    }
    
    // Parse breakdown JSON
    if (data && data.breakdown) {
      try {
        data.breakdown = typeof data.breakdown === 'string' 
          ? JSON.parse(data.breakdown) 
          : data.breakdown;
      } catch (e) {
        console.error('Error parsing podcast breakdown:', e);
      }
    }
    
    return data;
  },
  
  /**
   * Get podcasts by video ID (for YouTube videos)
   */
  async getByVideoId(videoId) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .contains('link', videoId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching podcast by video ID from Supabase:', error);
      return null;
    }
    
    if (data && data.metadata) {
      try {
        data.metadata = typeof data.metadata === 'string' 
          ? JSON.parse(data.metadata) 
          : data.metadata;
      } catch (e) {
        console.error('Error parsing podcast metadata:', e);
      }
    }
    
    return data;
  }
};

/**
 * Channels Table Operations
 */
export const channelsDB = {
  /**
   * Get all channels
   */
  async getAll() {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching channels from Supabase:', error);
      return null;
    }
    
    // Parse processedVideoIds JSON
    const channels = (data || []).map(channel => {
      const processedVideoIds = typeof channel.processed_video_ids === 'string'
        ? JSON.parse(channel.processed_video_ids || '[]')
        : (channel.processed_video_ids || channel.processedVideoIds || []);

      return {
        id: channel.id,
        channelId: channel.channel_id || channel.channelId,
        name: channel.name,
        enabled: channel.enabled,
        lastChecked: channel.last_checked || channel.lastChecked,
        lastVideoId: channel.last_video_id || channel.lastVideoId,
        processedVideoIds,
        autoProcess: channel.auto_process !== undefined ? channel.auto_process : channel.autoProcess,
        maxVideosPerCheck: channel.max_videos_per_check || channel.maxVideosPerCheck || 5,
        minVideoLength: channel.min_video_length || channel.minVideoLength || 300
      };
    });
    
    return channels;
  },
  
  /**
   * Insert or update channels
   */
  async upsert(channels) {
    if (!supabase || !channels || channels.length === 0) return false;
    
    // Map to Supabase column names
    const channelsToInsert = channels.map(channel => ({
      id: channel.id,
      channel_id: channel.channel_id || channel.channelId,
      name: channel.name,
      enabled: channel.enabled,
      last_checked: channel.last_checked || channel.lastChecked,
      last_video_id: channel.last_video_id || channel.lastVideoId,
      processed_video_ids: typeof channel.processed_video_ids === 'string'
        ? channel.processed_video_ids
        : JSON.stringify(channel.processed_video_ids || channel.processedVideoIds || []),
      auto_process: channel.auto_process !== undefined ? channel.auto_process : channel.autoProcess,
      max_videos_per_check: channel.max_videos_per_check || channel.maxVideosPerCheck,
      min_video_length: channel.min_video_length || channel.minVideoLength
    }));
    
    const { error } = await supabase
      .from('channels')
      .upsert(channelsToInsert, { onConflict: 'id' });
    
    if (error) {
      console.error('Error upserting channels to Supabase:', error);
      return false;
    }
    
    return true;
  },
  
  /**
   * Get channel by ID
   */
  async getById(id) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching channel from Supabase:', error);
      return null;
    }
    
    // Parse processedVideoIds JSON
    if (data) {
      data.processedVideoIds = typeof data.processedVideoIds === 'string'
        ? JSON.parse(data.processedVideoIds || '[]')
        : (data.processedVideoIds || []);
    }
    
    return data;
  }
};

/**
 * Cached Insights Storage
 */
export const insightsStorage = {
  async saveTechnologyReads(reads, generatedAt = new Date().toISOString()) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('technology_reads_snapshots')
      .insert({
        reads: JSON.stringify(reads),
        generated_at: generatedAt
      });
    if (error) {
      console.error('Error saving technology reads snapshot:', error);
      return false;
    }
    return true;
  },

  async loadLatestTechnologyReads() {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('technology_reads_snapshots')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading technology reads snapshot:', error);
      return null;
    }

    if (!data) return null;

    return {
      reads: typeof data.reads === 'string' ? JSON.parse(data.reads) : data.reads,
      generatedAt: data.generated_at
    };
  },

  async saveTechnologyPredictions(predictions, generatedAt = new Date().toISOString()) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('technology_predictions_snapshots')
      .insert({
        predictions: JSON.stringify(predictions),
        generated_at: generatedAt
      });
    if (error) {
      console.error('Error saving technology predictions snapshot:', error);
      return false;
    }
    return true;
  },

  async loadLatestTechnologyPredictions() {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('technology_predictions_snapshots')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading technology predictions snapshot:', error);
      return null;
    }

    if (!data) return null;

    return {
      predictions: typeof data.predictions === 'string' ? JSON.parse(data.predictions) : data.predictions,
      generatedAt: data.generated_at
    };
  }
};

