import client from "../../../lib/ApiClient"


export const OfferProducts = async () => {
    const response = await client.get('offers/')
    return response.data
}
