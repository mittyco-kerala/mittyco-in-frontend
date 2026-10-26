import client from "../../../lib/ApiClient";


export const Wishlist_post = async (data) => {

    try {

        const response = await client.post(
            "wishlist/add/",
            {
                variant: data.variant,
                variant_size: data.variant_size
            }
        );

        return response.data;

    }

    catch (error) {

        console.log(
            "Wishlist POST error:",
            error.response?.data || error
        );

        throw error;

    }

};


export const Wishlist_get = async () => {

    try {

        const response = await client.get(
            "wishlist/"
        );

        const payload = response.data;
        return Array.isArray(payload) ? payload : payload?.results || [];

    }

    catch (error) {

        console.log(
            "wishlist get : ",
            error
        );
        throw error;
    }

};


// delete item

export const Wishlist_delete = async (id) => {

    try {

        const response = await client.delete(
            `wishlist/remove/${id}/`
        );

        return response.data;

    }

    catch (error) {

        console.log(
            "wishlist delete error:",
            error.response?.data || error
        );

        throw error;

    }

};
