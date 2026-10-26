import { useQuery } from '@tanstack/react-query'
import { OfferApi } from '../api/Offer_Api'

function Offer_Query(options = {}) {
    return useQuery({
        queryKey:['offer_Products'],
        queryFn: OfferApi,
        enabled: options.enabled ?? true,
    })
}

export default Offer_Query
