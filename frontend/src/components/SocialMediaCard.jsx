import { useCallback, useEffect, useState } from 'react';
import { Facebook, Instagram, Youtube, PlayCircle, LoaderCircle } from 'lucide-react';
import api from '../api/client';

/**
 * "Live & Social" glass card for an event page — embeds a highlight/live
 * YouTube video via the official iframe embed (not a hotlinked image), plus
 * link-out buttons to the organization's official social channels.
 * Renders nothing if the event has no social links configured.
 */
export default function SocialMediaCard({ socialLinks, eventTitle, autoPlayHighlight = false }) {
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoListingUnavailable, setVideoListingUnavailable] = useState(false);
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
      setVideoListingUnavailable(false);
    } catch (err) {
      if (err.response?.status === 503) {
        setVideoListingUnavailable(true);
      } else {
        setVideoError(err.response?.data?.message || 'Could not load channel videos.');
      }
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  const checkVideoListing = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const { data } = await api.get('/youtube/status');
      if (data.individualVideoCardsEnabled) {
        await loadVideos();
      } else {
        setVideoListingUnavailable(true);
        setLoadingVideos(false);
      }
    } catch (err) {
      setVideoError(err.response?.data?.message || 'Could not check YouTube video listing settings.');
      setLoadingVideos(false);
    }
  }, [loadVideos]);

  useEffect(() => {
    if (youtubeChannelUrl) checkVideoListing();
  }, [youtubeChannelUrl, checkVideoListing]);

  if (!facebookUrl && !instagramUrl && !youtubeChannelUrl && !youtubeVideoId) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gray-900 dark:text-white">
        <PlayCircle size={20} className="text-maroon-500" /> {eventTitle} — Live & Social
      </h2>

      {youtubeVideoId && (
        <div className="mb-5 aspect-video w-full overflow-hidden rounded-2xl">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${encodeURIComponent(youtubeVideoId)}${autoPlayHighlight ? `?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${encodeURIComponent(youtubeVideoId)}` : ''}`}
            title={autoPlayHighlight ? `${eventTitle} performance video` : `${eventTitle} highlight video`}
            allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {autoPlayHighlight && youtubeChannelUrl && !youtubeVideoId && (
        <div className="mb-5 flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-maroon-950 via-maroon-800 to-gold-900 p-6 text-center text-white">
          <div className="max-w-md">
            <Youtube className="mx-auto mb-3 text-red-300" size={30} />
            <h3 className="font-display text-xl font-bold">Jasmine Sandlas performance video</h3>
            <p className="mt-2 text-sm text-white/80">
              The performance is scheduled for October 9, 2026. Its video will play here once PCTE publishes it.
            </p>
          </div>
        </div>
      )}

      {youtubeChannelUrl && !autoPlayHighlight && (
        <section className="mb-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Youtube size={17} className="text-red-500" /> Videos from the official PCTE channel
          </h3>
          <div className="mb-5 aspect-video w-full overflow-hidden rounded-2xl">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/videoseries?list=UUanrHeEVzkCQ4_clkqMMT-A"
              title="PCTE Group of Institutes YouTube uploads"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {videoListingUnavailable && (
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Browse the complete uploads playlist above. Add a YouTube Data API key to show individual videos as cards here.
            </p>
          )}
          {videos.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {videos.map((video) => (
                <div key={video.videoId} className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="aspect-video">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}`}
                      title={video.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="truncate px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200" title={video.title}>
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          )}
          {videoError && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{videoError}</p>}
          {loadingVideos && (
            <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <LoaderCircle size={15} className="animate-spin" /> Loading video cards...
            </p>
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
