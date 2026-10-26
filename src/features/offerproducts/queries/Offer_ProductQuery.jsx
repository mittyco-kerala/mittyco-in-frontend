

import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { OfferProducts } from '../api/Offer_productApi'

function Offer_ProductQuery() {
    return useQuery({
        queryKey: ['offerProducts'],
        queryFn: OfferProducts
    })
}

export default Offer_ProductQuery
