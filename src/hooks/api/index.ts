import axiosInstance from "@/api/axios";
import {
    useMutation,
    useQuery,
    type UseMutationOptions,
    type UseQueryOptions,
} from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success?: boolean;
    message?: string;
    data?: T;
    error?: string;
    show_toast?: boolean;
}

type QueryOptions<T> = Omit<
    UseQueryOptions<ApiResponse<T>>,
    "queryKey" | "queryFn"
>;

type MutationOptions<TData, TVariables> = UseMutationOptions<
    ApiResponse<TData>,
    Error,
    TVariables
>;

// ─── GET ────────────────────────────────────────────────────────────────────

export const useGetApi = <
    TData,
    TParams extends Record<string, unknown> = Record<string, unknown>
>(
    url: string,
    params?: TParams,
    options?: QueryOptions<TData> & { queryKey?: string }
) => {
    const { queryKey, ...restOptions } = options ?? {};

    const safeParams =
        params && Object.keys(params).length > 0 ? params : undefined;

    return useQuery<ApiResponse<TData>>({
        queryKey: queryKey ? [queryKey, safeParams] : [url, safeParams],
        queryFn: async () => {
            const { data } = await axiosInstance.get<ApiResponse<TData>>(url, {
                params: safeParams,
            });
            return data;
        },
        ...restOptions,
    });
};

// ─── POST ───────────────────────────────────────────────────────────────────

export const usePostApi = <TData, TBody = unknown>(
    url: string,
    options?: MutationOptions<TData, TBody>
) => {
    return useMutation<ApiResponse<TData>, Error, TBody>({
        mutationFn: async (body) => {
            const { data } = await axiosInstance.post<ApiResponse<TData>>(url, body);
            return data;
        },
        ...options,
    });
};

// ─── PUT ────────────────────────────────────────────────────────────────────

export type WithOptionalId<TBody> = { id?: string | number; body: TBody };

export const usePutApi = <TData, TBody = unknown>(
    url: string,
    options?: MutationOptions<TData, WithOptionalId<TBody>>
) => {
    return useMutation<ApiResponse<TData>, Error, WithOptionalId<TBody>>({
        mutationFn: async ({ id, body }) => {
            const endpoint = id !== undefined ? `${url}/${id}` : url;
            const { data } = await axiosInstance.put<ApiResponse<TData>>(endpoint, body);
            return data;
        },
        ...options,
    });
};

// ─── PATCH ──────────────────────────────────────────────────────────────────

export const usePatchApi = <TData, TBody = unknown>(
    url: string,
    options?: MutationOptions<TData, WithOptionalId<TBody>>
) => {
    return useMutation<ApiResponse<TData>, Error, WithOptionalId<TBody>>({
        mutationFn: async ({ id, body }) => {
            const endpoint = id !== undefined ? `${url}/${id}` : url;
            const { data } = await axiosInstance.patch<ApiResponse<TData>>(endpoint, body);
            return data;
        },
        ...options,
    });
};

// ─── DELETE ─────────────────────────────────────────────────────────────────

export type DeleteVars<TId extends string | number = string | number> =
    | { id?: TId; body?: unknown }
    | TId
    | void
    | undefined;

export const useDeleteApi = <
    TData,
    TId extends string | number = string | number
>(
    url: string,
    options?: MutationOptions<TData, DeleteVars<TId>>
) => {
    return useMutation<ApiResponse<TData>, Error, DeleteVars<TId>>({
        mutationFn: async (vars) => {
            const id =
                typeof vars === "object" && vars !== null && "id" in vars
                    ? (vars as { id?: TId }).id
                    : vars;
            const body =
                typeof vars === "object" && vars !== null && "body" in vars
                    ? (vars as { body?: unknown }).body
                    : undefined;

            const cleanUrl = url.replace(/\/+$/, "");
            const hasId =
                id !== undefined &&
                id !== null &&
                String(id).trim() !== "" &&
                typeof id !== "object";

            const endpoint = hasId ? `${cleanUrl}/${id}` : cleanUrl;
            const { data } = await axiosInstance.delete<ApiResponse<TData>>(
                endpoint,
                { data: body }
            );
            return data;
        },
        ...options,
    });
};