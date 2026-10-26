import client from "../../../lib/ApiClient"

export const GetcartProduct = async (id) => {
    try {
        const response = await client.get(`cart/`)

        return response.data
    }
    catch (error) {
        console.log('error : ', error)
        throw error;
    }
}


// send the updated quantity to backend and update with PUT method

export const saveQuantity = async (id, quantity) => {
    try {
        await client.patch(`cart/update/${id}/`, {
            quantity,
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// remove item in cart 

export const RemoveCart = async (id) => {
    const response = await client.delete(`cart/remove/${id}/`)
    return response.data
}
