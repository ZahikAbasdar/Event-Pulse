const STORAGE_TIMEOUT_MS = 20000;

function getConfiguration() {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl && !serviceRoleKey) return null;
  if (!rawUrl || !serviceRoleKey) {
    throw new Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const storageUrl = new URL(rawUrl);
  if (!['https:', 'http:'].includes(storageUrl.protocol)
    || (process.env.NODE_ENV === 'production' && storageUrl.protocol !== 'https:')) {
    throw new Error('Supabase object storage must use HTTPS in production.');
  }

  return { baseUrl: storageUrl.origin, serviceRoleKey };
}

function isConfigured() {
  return getConfiguration() !== null;
}

function encodeObjectPath(objectPath) {
  return objectPath.split('/').map(encodeURIComponent).join('/');
}

async function uploadObject({ bucket, objectPath, body, contentType }) {
  const configuration = getConfiguration();
  if (!configuration) throw new Error('Supabase object storage is not configured.');

  let response;
  try {
    response = await fetch(
      `${configuration.baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
      {
        method: 'POST',
        headers: {
          apikey: configuration.serviceRoleKey,
          Authorization: `Bearer ${configuration.serviceRoleKey}`,
          'Content-Type': contentType,
          'x-upsert': 'false',
        },
        body,
        signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
      }
    );
  } catch (error) {
    console.error('[storage] Object upload request failed:', error.message);
    throw new Error('Could not reach persistent object storage.');
  }

  if (!response.ok) {
    console.error('[storage] Object upload was rejected with status:', response.status);
    throw new Error('Persistent object storage could not save the upload.');
  }
}

async function downloadObject({ bucket, objectPath }) {
  const configuration = getConfiguration();
  if (!configuration) throw new Error('Supabase object storage is not configured.');

  let response;
  try {
    response = await fetch(
      `${configuration.baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`,
      {
        headers: {
          apikey: configuration.serviceRoleKey,
          Authorization: `Bearer ${configuration.serviceRoleKey}`,
        },
        signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS),
      }
    );
  } catch (error) {
    console.error('[storage] Object download request failed:', error.message);
    throw new Error('Could not reach persistent object storage.');
  }

  if (!response.ok) {
    console.error('[storage] Object download was rejected with status:', response.status);
    throw new Error('The stored object is currently unavailable.');
  }

  return Buffer.from(await response.arrayBuffer());
}

function getPublicObjectUrl({ bucket, objectPath }) {
  const configuration = getConfiguration();
  if (!configuration) throw new Error('Supabase object storage is not configured.');
  return `${configuration.baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;
}

module.exports = { isConfigured, uploadObject, downloadObject, getPublicObjectUrl };
