import { useQuery } from "@tanstack/react-query";
import { getPromoBanners } from "../api/PromoBannersApi";

function PromoBanners_Query(options = {}) {
    return useQuery({
        queryKey: ["promo-banners"],
        queryFn: getPromoBanners,
        enabled: options.enabled ?? true,
        staleTime: 1000 * 60 * 5,
    });
}

export default PromoBanners_Query;
