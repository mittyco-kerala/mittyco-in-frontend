import { useQuery } from "@tanstack/react-query";

import { getHeroBanners } from "../api/HeroApi";

function Hero_Query(options = {}) {

    return useQuery({

        queryKey: ["hero-banners"],

        queryFn: getHeroBanners,
        enabled: options.enabled ?? true,

        staleTime: 1000 * 60 * 5,

    });

}

export default Hero_Query;
