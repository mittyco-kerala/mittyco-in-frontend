import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "../api/Search_Api";

const Search_Query = (params) => {

    return useQuery({

        queryKey: [
            "search-products",
            params
        ],

        queryFn: () =>
            searchProducts(params),

        keepPreviousData: true

    });

};

export default Search_Query;