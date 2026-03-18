import React, { useRef, useEffect } from "react";

interface Column<T> {
    header: string;
    accessor: keyof T;
    render?: (value: any, row: T) => React.ReactNode;
}

interface Props<T> {
    columns: Column<T>[];
    data: T[];
    loadMore: () => void;
    hasMore: boolean;
    loading?: boolean;
}

function InfiniteTable<T>({
    columns,
    data,
    loadMore,
    hasMore,
    loading
}: Props<T>) {

    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();

    }, [hasMore, loadMore]);

    return (
        <div className="w-full overflow-auto rounded-lg border max-h-125">

            <table className="w-full text-sm">

                <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={String(col.accessor)}
                                className="px-4 py-3 text-left font-semibold"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>

                    {loading && data.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-6 text-gray-400"
                            >
                                Loading...
                            </td>
                        </tr>
                    )}

                    {!loading && data.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-6 text-gray-400"
                            >
                                No Data Found
                            </td>
                        </tr>
                    )}

                    {data.map((row, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={String(col.accessor)} className="px-4 py-3">
                                    {col.render
                                        ? col.render(row[col.accessor], row)
                                        : String(row[col.accessor])}
                                </td>
                            ))}
                        </tr>
                    ))}

                </tbody>

            </table>

            {hasMore && (
                <div
                    ref={loaderRef}
                    className="py-4 text-center text-gray-400"
                >
                    Loading more...
                </div>
            )}

        </div>
    );
}

export default InfiniteTable;