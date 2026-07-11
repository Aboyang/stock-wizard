import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../../lib/api"

export function useGetSuggestions(search: string) {
    return useQuery({
        queryKey: ["suggestions", search],
        queryFn: () => apiGet<string[]>("/api/security/suggestion", { search }),
        enabled: !!search,
    })
}
