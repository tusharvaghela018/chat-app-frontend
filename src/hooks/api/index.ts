import axiosInstance from "@/api/axios";
import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";

export const useGetApi = <
    TResponse,
    TParams extends Record<string, any> = {}
>(
    queryKey: string,
    url: string,
    params?: TParams,
    options?: UseQueryOptions<TResponse>
) => {
    return useQuery<TResponse>({
        queryKey: [queryKey, params],
        queryFn: async () => {
            const { data } = await axiosInstance.get<TResponse>(url, { params });
            return data;
        },
        ...options,
    });
};

export const usePostApi = <
    TResponse,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<TResponse, unknown, TBody>
) => {
    return useMutation<TResponse, unknown, TBody>({
        mutationFn: async (body: TBody) => {
            const { data } = await axiosInstance.post<TResponse>(url, body);
            return data;
        },
        ...options,
    });
};

export const usePutApi = <
    TResponse,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<TResponse, unknown, { id: string | number; body: TBody }>
) => {
    return useMutation<TResponse, unknown, { id: string | number; body: TBody }>({
        mutationFn: async ({ id, body }) => {
            const { data } = await axiosInstance.put<TResponse>(`${url}/${id}`, body);
            return data;
        },
        ...options,
    });
};

export const usePatchApi = <
    TResponse,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<TResponse, unknown, { id: string | number; body: TBody }>
) => {
    return useMutation<TResponse, unknown, { id: string | number; body: TBody }>({
        mutationFn: async ({ id, body }) => {
            const { data } = await axiosInstance.patch<TResponse>(`${url}/${id}`, body);
            return data;
        },
        ...options,
    });
};

export const useDeleteApi = <
    TResponse,
    TId extends string | number = string | number
>(
    url: string,
    options?: UseMutationOptions<TResponse, unknown, TId>
) => {
    return useMutation<TResponse, unknown, TId>({
        mutationFn: async (id: TId) => {
            const { data } = await axiosInstance.delete<TResponse>(`${url}/${id}`);
            return data;
        },
        ...options,
    });
};