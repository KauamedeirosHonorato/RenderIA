// API Configuration — reads from Firebase or localStorage or env
export let API_BASE_URL = localStorage.getItem('nexa_api_url') || import.meta.env.VITE_COLAB_URL || "http://127.0.0.1:8000";

export const setApiUrl = (url) => {
    API_BASE_URL = url;
    localStorage.setItem('nexa_api_url', url);
    window.location.reload();
};

export const updateApiUrlSilent = (url) => {
    API_BASE_URL = url;
    localStorage.setItem('nexa_api_url', url);
};
