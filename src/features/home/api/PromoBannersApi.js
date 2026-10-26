import client from "../../../lib/ApiClient";

export const getPromoBanners = async () => {
    const response = await client.get("api/promo-banners/");
    return response.data;
};
