const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const CHANNEL_HANDLE = '@pctegroupofinstitutes';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const PLAYLIST_CACHE_MS = 60 * 60 * 1000;
let uploadsPlaylistCache = null;

exports.getChannelStatus = (req, res) => {
  res.json({ success: true, individualVideoCardsEnabled: Boolean(process.env.YOUTUBE_API_KEY) });
};

async function youtubeRequest(path, params) {
  const url = new URL(`${YOUTUBE_API}/${path}`);
  Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY }).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    console.error('[youtube] Data API request failed:', err.message);
    throw new ApiError(502, 'Could not reach the YouTube Data API');
  }

  const data = await response.json();
  if (!response.ok) {
    console.error('[youtube] Data API returned an error:', data.error?.message || response.statusText);
    throw new ApiError(502, 'The YouTube Data API request failed');
  }
  return data;
}

async function getUploadsPlaylistId() {
  if (uploadsPlaylistCache && uploadsPlaylistCache.expiresAt > Date.now()) {
    return uploadsPlaylistCache.id;
  }

  const data = await youtubeRequest('channels', {
    part: 'contentDetails',
    forHandle: CHANNEL_HANDLE,
  });
  const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new ApiError(502, 'The configured YouTube channel has no public uploads playlist');

  uploadsPlaylistCache = { id: playlistId, expiresAt: Date.now() + PLAYLIST_CACHE_MS };
  return playlistId;
}

exports.listChannelVideos = asyncHandler(async (req, res) => {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new ApiError(503, 'YouTube video listing is not configured. Set YOUTUBE_API_KEY in backend/.env.');
  }

  const playlistId = await getUploadsPlaylistId();
  const data = await youtubeRequest('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: '12',
    pageToken: typeof req.query.pageToken === 'string' ? req.query.pageToken : '',
  });

  const videos = (data.items || []).map((item) => ({
    videoId: item.contentDetails?.videoId,
    title: item.snippet?.title || 'PCTE video',
    description: item.snippet?.description || '',
    publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
  })).filter((video) => video.videoId);

  res.json({ success: true, videos, nextPageToken: data.nextPageToken || null });
});
