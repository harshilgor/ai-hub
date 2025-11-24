# Supabase Setup Guide

This guide will help you set up Supabase for the AI Hub backend.

## Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon/public key** (this is your `SUPABASE_ANON_KEY`)

## Step 2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `backend/supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- `papers` table for research papers
- `podcasts` table for video/podcast insights
- `channels` table for YouTube channel configurations
- `settings` table for global settings
- Indexes for better query performance
- Row Level Security (RLS) policies

## Step 3: Configure Environment Variables

Add these to your `backend/.env` file:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** If you need admin access (for migrations, etc.), you can also add:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Security Warning:** Never commit the service role key to git. It has admin access.

## Step 4: Verify Connection

Restart your backend server. You should see:
- `✅ Connected to Supabase` in the logs (if configured)
- Or `⚠️ Supabase credentials not found. Using JSON file storage as fallback.` (if not configured)

## Step 5: Migrate Existing Data (Optional)

If you have existing data in JSON files, you can migrate it:

1. The system will automatically use Supabase if configured
2. If Supabase is not configured, it falls back to JSON files
3. To migrate existing data, you can use the migration script (to be created)

## Troubleshooting

### "Error fetching papers from Supabase"
- Check that your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Verify that the tables were created successfully
- Check RLS policies if you're getting permission errors

### "Row Level Security policy violation"
- The migration includes policies that allow all operations
- If you're still getting errors, check your Supabase project settings
- You may need to adjust the RLS policies in the SQL Editor

### Tables not found
- Make sure you ran the migration SQL in the Supabase SQL Editor
- Check that the migration completed without errors

## MCP Configuration (Optional)

If you want to use Supabase MCP in Cursor, add this to your MCP configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (found in your project URL).

## Next Steps

Once Supabase is configured:
1. The backend will automatically use Supabase instead of JSON files
2. All data will be stored in the cloud database
3. You can access your data from the Supabase Dashboard
4. You can query data using Supabase's SQL Editor or API


