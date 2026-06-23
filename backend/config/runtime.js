const splitEnvList = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildOriginPattern = (originPattern) => {
  if (!originPattern.includes('*')) {
    return null;
  }

  const escaped = originPattern
    .split('*')
    .map((part) => escapeRegex(part))
    .join('.*');

  return new RegExp(`^${escaped}$`);
};

const expandLocalDevOrigins = (origins) => {
  const expandedOrigins = new Set(origins);

  if (expandedOrigins.has('http://localhost:5173')) {
    expandedOrigins.add('http://127.0.0.1:5173');
  }

  if (expandedOrigins.has('http://127.0.0.1:5173')) {
    expandedOrigins.add('http://localhost:5173');
  }

  return Array.from(expandedOrigins);
};

export const getAllowedClientOrigins = () => {
  const explicitOrigins = splitEnvList(
    process.env.CLIENT_URLS || process.env.CLIENT_URL || ''
  );

  if (explicitOrigins.length > 0) {
    return expandLocalDevOrigins(explicitOrigins);
  }

  return expandLocalDevOrigins(['http://localhost:5173']);
};

export const isAllowedClientOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return getAllowedClientOrigins().some((allowedOrigin) => {
    if (allowedOrigin === origin) {
      return true;
    }

    const pattern = buildOriginPattern(allowedOrigin);
    return pattern ? pattern.test(origin) : false;
  });
};

export const getPrimaryClientUrl = () => {
  const publicUrl = String(process.env.PUBLIC_APP_URL || '').trim();
  if (publicUrl) {
    return publicUrl;
  }

  const [firstOrigin] = getAllowedClientOrigins();
  return firstOrigin || 'http://localhost:5173';
};

export const resolveClientUrlForRequest = (req) => {
  const requestOrigin = String(req?.get?.('origin') || '').trim();

  if (requestOrigin && isAllowedClientOrigin(requestOrigin)) {
    return requestOrigin;
  }

  return getPrimaryClientUrl();
};
