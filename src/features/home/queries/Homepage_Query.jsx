import { useQuery } from "@tanstack/react-query";
import { getHomepage } from "../api/HomepageApi";

function Homepage_Query(options = {}) {
    return useQuery({
        queryKey: ["homepage"],
        queryFn: getHomepage,
        enabled: options.enabled ?? true,
        staleTime: 1000 * 60 * 5,
    });
}

export default Homepage_Query;

