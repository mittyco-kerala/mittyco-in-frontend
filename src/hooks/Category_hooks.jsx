import { useQuery } from '@tanstack/react-query'
import React from 'react'
import categoryApi from './Category_api'

function Category_hooks() {
    
  return useQuery({
    queryKey:['category'],
    queryFn: categoryApi
  })
}

export default Category_hooks
