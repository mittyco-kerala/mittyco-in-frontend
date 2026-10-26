import client from "../../../lib/ApiClient";

export const getHeroSideBanner = async () => {
    const response = await client.get("api/hero-side-banner/");
    return response.data;
};
