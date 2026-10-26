
import { useQuery } from '@tanstack/react-query'
import { ShopBy_categoryGet } from '../api/ShopBy_categoryApi'

function ShopBy_categoryQuery(options = {}) {
  return useQuery({
    queryKey : ['shopBycategory'],
    queryFn : ShopBy_categoryGet,
    enabled: options.enabled ?? true,
  })

}

export default ShopBy_categoryQuery
