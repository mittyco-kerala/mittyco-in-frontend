import client from "../../../lib/ApiClient";

export const getHomepage = async () => {
    const response = await client.get("homepage/");
    return response.data || {};
};

