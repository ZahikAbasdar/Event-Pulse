function getPublicBaseUrl(req) {
  const configuredUrl = process.env.RENDER_EXTERNAL_URL || process.env.CLIENT_URL;
  if (configuredUrl) {
    let parsed;
    try {
      parsed = new URL(configuredUrl);
    } catch (_err) {
      throw new Error('RENDER_EXTERNAL_URL or CLIENT_URL must be a valid absolute URL.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('RENDER_EXTERNAL_URL or CLIENT_URL must use HTTP or HTTPS.');
    }
    return parsed.origin;
  }

  const origin = req?.get('origin');
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (['http:', 'https:'].includes(parsed.protocol) && parsed.host === req.get('host')) {
        return parsed.origin;
      }
    } catch (_err) {
      throw new Error('The request Origin header is not a valid URL.');
    }
  }

  if (process.env.NODE_ENV !== 'production') return 'http://localhost:5173';
  throw new Error('Set RENDER_EXTERNAL_URL or CLIENT_URL before generating public links.');
}

module.exports = getPublicBaseUrl;
