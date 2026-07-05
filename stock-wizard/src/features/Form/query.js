import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../../lib/api"

export function useGetSuggestions(search) {
    return useQuery({
        queryKey: ["suggestions", search],
        queryFn: () => apiGet("/api/security/suggestion", { search }),
        enabled: !!search,
    })
}
