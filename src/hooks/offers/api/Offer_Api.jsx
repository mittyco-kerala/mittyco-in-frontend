import client from "../../../lib/ApiClient"


export const OfferApi = async () => {
    const response = await client.get('offers/');

    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return payload ? [payload] : [];
} 
