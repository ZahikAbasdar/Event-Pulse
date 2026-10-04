import { useCallback, useEffect, useState } from 'react';
import { Facebook, Instagram, Youtube, PlayCircle, LoaderCircle } from 'lucide-react';
import api from '../api/client';

function YouTubeVideoCard({ video, eventTitle }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setPlaying(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setPlaying(false);
      }}
    >
      <div className="relative aspect-video bg-gray-950">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?autoplay=1&mute=1&playsinline=1&rel=0`}
            title={video.title}
            allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative h-full w-full"
            aria-label={`Play ${video.title}`}
          >
            <img
              src={video.thumbnailUrl || `https://i.ytimg.com/vi/${encodeURIComponent(video.videoId)}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/15 transition group-hover:bg-black/35">
              <PlayCircle size={48} className="text-white drop-shadow-lg transition group-hover:scale-110" />
            </span>
          </button>
        )}
      </div>
      <p className="truncate px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200" title={video.title}>
        {video.title || `${eventTitle} video`}
      </p>
    </div>
  );
}

/**
 * "Live & Social" glass card for an event page — embeds a highlight/live
 * YouTube video via the official iframe embed (not a hotlinked image), plus
 * link-out buttons to the organization's official social channels.
 * Renders nothing if the event has no social links configured.
 */
export default function SocialMediaCard({ socialLinks, eventTitle }) {
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState('');
  const { facebookUrl, instagramUrl, youtubeChannelUrl, youtubeVideoId } = socialLinks || {};

  const loadVideos = useCallback(async (pageToken = null) => {
    setLoadingVideos(true);
    setVideoError('');
    try {
      const { data } = await api.get('/youtube/videos', {
        params: pageToken ? { pageToken } : {},
      });
      setVideos((current) => pageToken ? [...current, ...data.videos] : data.videos);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setVideoError(err.response?.data?.message || 'Could not load channel videos.');
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (youtubeChannelUrl) loadVideos();
  }, [youtubeChannelUrl, loadVideos]);

  if (!facebookUrl && !instagramUrl && !youtubeChannelUrl && !youtubeVideoId) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gray-900 dark:text-white">
        <PlayCircle size={20} className="text-maroon-500" /> {eventTitle} — Live & Social
      </h2>

      {youtubeVideoId && (
        <div className="mb-5">
          <YouTubeVideoCard
            video={{
              videoId: youtubeVideoId,
              title: `${eventTitle} highlight video`,
              thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(youtubeVideoId)}/hqdefault.jpg`,
            }}
            eventTitle={eventTitle}
          />
        </div>
      )}

      {youtubeChannelUrl && (
        <section className="mb-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Youtube size={17} className="text-red-500" /> Latest videos from the official PCTE channel
          </h3>
          {videos.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.filter((video) => video.videoId !== youtubeVideoId).map((video) => (
                <YouTubeVideoCard key={video.videoId} video={video} eventTitle={eventTitle} />
              ))}
            </div>
          )}
          {videoError && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{videoError}</p>}
          {loadingVideos && (
            <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <LoaderCircle size={15} className="animate-spin" /> Loading video cards...
            </p>
          )}
          {!loadingVideos && !videoError && videos.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No public videos are currently listed on the PCTE channel.</p>
          )}
          {!loadingVideos && videoError && (
            <button onClick={() => loadVideos()} className="btn-secondary mt-3 !py-2 text-xs">
              Retry loading video cards
            </button>
          )}
          {nextPageToken && !loadingVideos && (
            <button onClick={() => loadVideos(nextPageToken)} className="btn-secondary mt-4 !py-2 text-xs">
              Load more videos
            </button>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {youtubeChannelUrl && (
          <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 text-xs">
            <Youtube size={15} className="text-red-500" /> Watch more on YouTube
          </a>
        )}
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 text-xs">
            <Instagram size={15} className="text-pink-500" /> Follow on Instagram
          </a>
        )}
        {facebookUrl && (
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 text-xs">
            <Facebook size={15} className="text-blue-500" /> Follow on Facebook
          </a>
        )}
      </div>
    </div>
  );
}
