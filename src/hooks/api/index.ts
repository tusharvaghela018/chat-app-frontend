import axiosInstance from "@/api/axios";
import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";

export interface ApiResponse<T = unknown> {
    success?: boolean;
    message?: string;
    data?: T;
    error?: unknown;
    show_toast?: boolean;
}

export const useGetApi = <
    TData,
    TParams extends Record<string, any> = {}
>(
    queryKey: string,
    url: string,
    params?: TParams,
    options?: UseQueryOptions<ApiResponse<TData>>
) => {
    return useQuery<ApiResponse<TData>>({
        queryKey: [queryKey, params],
        queryFn: async () => {
            const { data } = await axiosInstance.get<ApiResponse<TData>>(url, { params });
            return data;
        },
        ...options,
    });
};

export const usePostApi = <
    TData,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<ApiResponse<TData>, unknown, TBody>
) => {
    return useMutation<ApiResponse<TData>, unknown, TBody>({
        mutationFn: async (body: TBody) => {
            const { data } = await axiosInstance.post<ApiResponse<TData>>(url, body);
            return data;
        },
        ...options,
    });
};

export const usePutApi = <
    TData,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<
        ApiResponse<TData>,
        unknown,
        { id: string | number; body: TBody }
    >
) => {
    return useMutation<
        ApiResponse<TData>,
        unknown,
        { id: string | number; body: TBody }
    >({
        mutationFn: async ({ id, body }) => {
            const { data } = await axiosInstance.put<ApiResponse<TData>>(
                `${url}/${id}`,
                body
            );
            return data;
        },
        ...options,
    });
};

export const usePatchApi = <
    TData,
    TBody = unknown
>(
    url: string,
    options?: UseMutationOptions<
        ApiResponse<TData>,
        unknown,
        { id: string | number; body: TBody }
    >
) => {
    return useMutation<
        ApiResponse<TData>,
        unknown,
        { id: string | number; body: TBody }
    >({
        mutationFn: async ({ id, body }) => {
            const { data } = await axiosInstance.patch<ApiResponse<TData>>(
                `${url}/${id}`,
                body
            );
            return data;
        },
        ...options,
    });
};

export const useDeleteApi = <
    TData,
    TId extends string | number = string | number
>(
    url: string,
    options?: UseMutationOptions<ApiResponse<TData>, unknown, TId>
) => {
    return useMutation<ApiResponse<TData>, unknown, TId>({
        mutationFn: async (id: TId) => {
            const { data } = await axiosInstance.delete<ApiResponse<TData>>(
                `${url}/${id}`
            );
            return data;
        },
        ...options,
    });
};