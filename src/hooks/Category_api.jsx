import client from "../lib/ApiClient"


const categoryApi=async()=>{
    const response = await client('categories')
 
    return response.data
}

export default categoryApi
