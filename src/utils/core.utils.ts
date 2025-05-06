export const safeJSONParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('[Sociogram.MiniApp] Failed to parse JSON:', error);
    return null;
  }
};

export const urlSafeDecode = (urlencoded: string): string => {
  try {
    urlencoded = urlencoded.replace(/\+/g, '%20');
    return decodeURIComponent(urlencoded);
  } catch (error) {
    console.error('[Sociogram.MiniApp] Failed to decode URL:', error);
    return urlencoded;
  }
};

export const urlParseQueryString = (queryString: string): Record<string, string | null> => {
  const params: Record<string, string | null> = {};
  if (!queryString.length) {
    return params;
  }
  const queryStringParams = queryString.split('&');
  let i, param, paramName, paramValue;
  for (i = 0; i < queryStringParams.length; i++) {
    param = queryStringParams[i].split('=');
    paramName = urlSafeDecode(param[0]);
    paramValue = param[1] == null ? null : urlSafeDecode(param[1]);
    params[paramName] = paramValue;
  }
  return params;
};

export const safeParseUrlParams = (): Record<string, string | null> => {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(
      Array.from(searchParams.entries()).map(([key, value]) => {
        if (value === 'null') return [key, null];
        return [key, value];
      })
    );
  } catch (error) {
    console.error('[Sociogram.MiniApp] Failed to parse URL parameters:', error);
    return {};
  }
};
