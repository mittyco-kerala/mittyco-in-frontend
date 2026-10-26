import client from "../../../lib/ApiClient"



export const NewArrivals =async () =>{
    try{
        const response = await client.get('new-arrivals/')
        const payload = response.data;
        return Array.isArray(payload) ? { results: payload, count: payload.length } : { results: Array.isArray(payload?.results) ? payload.results : [], count: Number(payload?.count ?? 0), next: payload?.next ?? null, previous: payload?.previous ?? null };
    }
    catch(error){
        console.log(error)
        throw error
    }
}
