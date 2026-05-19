const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  const hostname = window.location.hostname;
  // If deployed on Render, default to the user's actual backend URL
  if (hostname.includes('.onrender.com')) {
    return 'https://codesync-server-ymmg.onrender.com';
  }

  return 'http://localhost:4000';
};

export const BACKEND_URL = getBackendUrl();
