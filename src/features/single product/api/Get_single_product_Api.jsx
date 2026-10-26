import client from "../../../lib/ApiClient"

export const GetsingleProduct = async (id) => {
    try {
        const response = await client.get(`product/${id}/`)
        return response.data
    }
    catch (error) {
        console.log(error)
        throw error
    }
}
