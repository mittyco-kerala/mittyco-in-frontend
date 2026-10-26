import client from "../../../lib/ApiClient"


export const ShopBy_categoryGet = async () =>{
    const response = await client.get('home/categories/')
    return response.data
}

