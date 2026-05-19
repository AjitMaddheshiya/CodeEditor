const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  const hostname = window.location.hostname;
  // If deployed on Render, try to match the client's subdomain with the server's subdomain
  if (hostname.includes('.onrender.com')) {
    if (hostname.startsWith('codesync-client-')) {
      return `https://${hostname.replace('codesync-client-', 'codesync-server-')}`;
    }
    if (hostname === 'codesync-client.onrender.com') {
      return 'https://codesync-server.onrender.com';
    }
  }

  return 'http://localhost:4000';
};

export const BACKEND_URL = getBackendUrl();
