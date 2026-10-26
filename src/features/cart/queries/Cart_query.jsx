

import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { GetcartProduct } from '../api/Cart_api'
import { hasAuthSession } from '../../auth/authUtils'

function Cart_query(options = {}) {
    const { enabled, ...queryOptions } = options;
    return useQuery({
        queryKey : ['cartProduct'],
        queryFn : GetcartProduct,
        enabled: enabled ?? hasAuthSession(),
        ...queryOptions
    })
}

export default Cart_query
