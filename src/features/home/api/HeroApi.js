import client from "../../../lib/ApiClient";

export const getHeroBanners = async () => {

    const response = await client.get(
        "hero-banners/"
    );

    return response.data;

};