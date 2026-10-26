


import { useQuery } from '@tanstack/react-query'
import { NewArrivals } from '../api/New_Arrivals'

function Newarrival_Query(options = {}) {
  return useQuery({
    queryKey : ['NewArrivals'],
    queryFn : NewArrivals,
    enabled: options.enabled ?? true,
  })
}

export default Newarrival_Query
