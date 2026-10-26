import { API_URL } from "../lib/apiUrl";

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (/^(https?:)?\/\//i.test(imagePath)) {
        return imagePath;
    }

    return `${API_URL.replace(/\/$/, "")}/${String(imagePath).replace(/^\//, "")}`;
};
