import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { GetsingleProduct } from '../api/Get_single_product_Api'

function GetSingle_product_Query(id) {
    return useQuery({
        queryKey: ['singleProduct',id],
        queryFn: ()=> GetsingleProduct(id)
    })

}

export default GetSingle_product_Query
