import { API_URL } from "../lib/apiUrl";

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (/^(https?:)?\/\//i.test(imagePath)) {
        return imagePath;
    }

    const normalizedPath = `/${String(imagePath).replace(/^\//, "")}`;

    // Django returns media/static paths from the API root (for example,
    // /media/hero_banners/banner.png). When the API base is an absolute
    // origin with a /backend path, do not append that path to media URLs:
    // /backend/media/... is not served by Nginx, while /media/... is.
    if (/^https?:\/\//i.test(API_URL) && /^(\/media|\/static)\//i.test(normalizedPath)) {
        return `${new URL(API_URL).origin}${normalizedPath}`;
    }

    return `${API_URL.replace(/\/$/, "")}${normalizedPath}`;
};
