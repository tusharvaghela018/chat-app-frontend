import Pagination from "@/common/Pagination";
import type { Option } from "@/common/ReactSelect";
import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";

interface Column<T> {
    header: string;
    accessor: keyof T;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    enableSorting?: boolean;
    enablePagination?: boolean;
}

function Table<T>({
    columns,
    data,
    loading,
    enableSorting = false,
    enablePagination = false
}: TableProps<T>) {

    const { control } = useForm({
        defaultValues: {
            perPage: { label: "10", value: 10 }
        }
    });

    const perPageOptions: Option[] = [
        { label: "10", value: 10 },
        { label: "20", value: 20 },
        { label: "50", value: 50 }
    ];

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const sortedData = useMemo(() => {

        if (!sortKey) return data;

        return [...data].sort((a, b) => {

            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal === bVal) return 0;

            if (sortDir === "asc") return aVal > bVal ? 1 : -1;

            return aVal < bVal ? 1 : -1;

        });

    }, [data, sortKey, sortDir]);

    const paginatedData = useMemo(() => {

        if (!enablePagination) return sortedData;

        const start = pageIndex * pageSize;
        return sortedData.slice(start, start + pageSize);

    }, [sortedData, pageIndex, pageSize]);

    const pageCount = Math.ceil(sortedData.length / pageSize);

    const toggleSort = (key: keyof T) => {

        if (!enableSorting) return;

        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    return (
        <div className="flex flex-col gap-4">

            <div className="w-full overflow-auto rounded-lg border">

                <table className="w-full text-sm">

                    <thead className="bg-gray-100">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.accessor)}
                                    className={`px-4 py-3 text-left font-semibold ${col.sortable ? "cursor-pointer" : ""
                                        }`}
                                    onClick={() =>
                                        col.sortable && toggleSort(col.accessor)
                                    }
                                >
                                    <div className="flex gap-1 items-center">

                                        {col.header}

                                        {enableSorting &&
                                            sortKey === col.accessor && (
                                                <span className="text-xs">
                                                    {sortDir === "asc" ? "▲" : "▼"}
                                                </span>
                                            )}

                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>

                        {loading && (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-6 text-gray-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            paginatedData.map((row, i) => (
                                <tr key={i} className="border-t hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.accessor)}
                                            className="px-4 py-3"
                                        >
                                            {col.render
                                                ? col.render(row[col.accessor], row)
                                                : String(row[col.accessor])}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                    </tbody>

                </table>

            </div>

            {enablePagination && (
                <Pagination
                    pageIndex={pageIndex}
                    pageCount={pageCount}
                    canPreviousPage={pageIndex > 0}
                    canNextPage={pageIndex < pageCount - 1}
                    onFirst={() => setPageIndex(0)}
                    onPrevious={() => setPageIndex((p) => p - 1)}
                    onNext={() => setPageIndex((p) => p + 1)}
                    onLast={() => setPageIndex(pageCount - 1)}
                    control={control}
                    perPageOptions={perPageOptions}
                    onPerPageChange={(value) => {
                        setPageSize(value);
                        setPageIndex(0);
                    }}
                />
            )}

        </div>
    );
}

export default Table;