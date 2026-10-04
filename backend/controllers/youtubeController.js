const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const CHANNEL_ID = 'UCanrHeEVzkCQ4_clkqMMT-A';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const FEED_CACHE_MS = 60 * 1000;
let feedCache = null;

exports.getChannelStatus = (req, res) => {
  res.json({ success: true, individualVideoCardsEnabled: true });
};

function decodeXml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function getChannelVideos() {
  if (feedCache && feedCache.expiresAt > Date.now()) return feedCache.videos;

  let response;
  try {
    response = await fetch(FEED_URL, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    console.error('[youtube] Public uploads feed request failed:', err.message);
    throw new ApiError(502, 'Could not reach the official YouTube channel feed');
  }

  if (!response.ok) {
    console.error('[youtube] Public uploads feed returned an error:', response.statusText);
    throw new ApiError(502, 'The official YouTube channel feed is unavailable');
  }

  const xml = await response.text();
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
    return {
      videoId,
      title: title ? decodeXml(title) : 'PCTE video',
      publishedAt: publishedAt || null,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }).filter(Boolean);

  feedCache = { videos, expiresAt: Date.now() + FEED_CACHE_MS };
  return videos;
}

exports.listChannelVideos = asyncHandler(async (req, res) => {
  const videos = await getChannelVideos();
  res.json({ success: true, videos, nextPageToken: null });
});
