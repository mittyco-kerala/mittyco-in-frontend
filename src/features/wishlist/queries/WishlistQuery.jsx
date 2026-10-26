

import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Wishlist_get } from '../api/Wishlisht_Api'
import { hasAuthSession } from '../../auth/authUtils'

function WishlistQuery(options = {}) {
    const { enabled, ...queryOptions } = options;

    return useQuery({
        queryKey: ['wishlist'],
        queryFn: Wishlist_get,
        enabled: enabled ?? hasAuthSession(),
        ...queryOptions
    })
}

export default WishlistQuery
