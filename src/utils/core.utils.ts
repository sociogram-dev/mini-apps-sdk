import { HashParams } from './utils.types';

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

export const urlParseQueryString = (queryString: string): Record<string, string | undefined> => {
  const params: Record<string, string | undefined> = {};
  if (!queryString.length) {
    return params;
  }
  const queryStringParams = queryString.split('&');
  let i, param, paramName, paramValue;
  for (i = 0; i < queryStringParams.length; i++) {
    param = queryStringParams[i].split('=');
    paramName = urlSafeDecode(param[0]);
    paramValue = param[1] == null ? undefined : urlSafeDecode(param[1]);
    params[paramName] = paramValue;
  }
  return params;
}

export const urlParseHashParams = (locationHash: string): HashParams => {
  locationHash = locationHash.replace(/^#/, '');
  const params: HashParams = {};

  if (!locationHash.length) {
    return params;
  }

  if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
    params._path = urlSafeDecode(locationHash);
    return params;
  }

  const qIndex = locationHash.indexOf('?');
  if (qIndex >= 0) {
    const pathParam = locationHash.substr(0, qIndex);
    params._path = urlSafeDecode(pathParam);
    locationHash = locationHash.substr(qIndex + 1);
  }

  const query_params = urlParseQueryString(locationHash);
  for (const k in query_params) {
    params[k] = query_params[k];
  }
  return params;
};
