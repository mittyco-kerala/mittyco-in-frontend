import client from "../../../lib/ApiClient"


export const addToCart_Post = async (product) => {
    try {
        const response = await client.post(
            "cart/add/",
            product
        );
        return response.data;

    }
    catch (error) {
        console.log("CartPOST error : ", error);
        throw error;
    }
}
