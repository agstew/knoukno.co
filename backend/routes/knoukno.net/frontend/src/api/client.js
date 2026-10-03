export const API_ORIGIN = '';

export const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiFetch = (path, options) => fetch(apiUrl(path), options);
