# Quick Start: Adding Your First Channel

## Channel Added Successfully! ✅

The channel **Dwarkesh Patel** has been added to your system.

## Next Steps

### 1. Restart Your Server
The server needs to be restarted to pick up the latest changes:

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### 2. Verify Channel Was Added
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/channels" -Method GET | ConvertTo-Json
```

### 3. Manually Trigger First Check
After restarting, test the channel:

```powershell
$channelId = (Invoke-RestMethod -Uri "http://localhost:3001/api/channels" -Method GET).channels[0].id
Invoke-RestMethod -Uri "http://localhost:3001/api/channels/$channelId/check" -Method POST
```

### 4. Automatic Processing
Once the server is running, the system will:
- Check the channel every 6 hours automatically
- Fetch up to 5 new videos per check
- Process transcripts and extract insights
- Store in the database

## Channel Details

- **Name**: Dwarkesh Patel
- **Handle**: @DwarkeshPatel
- **Auto-Process**: Enabled
- **Max Videos Per Check**: 5

## View Processed Podcasts

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/podcasts" -Method GET | ConvertTo-Json
```

## Troubleshooting

If you see errors:
1. Make sure the server is restarted
2. Check that YouTube API key is set in `.env`
3. Verify the channel exists and has videos
4. Check server logs for detailed error messages

