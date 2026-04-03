import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { type Control, type FieldValues, type Path } from "react-hook-form";
import Select, { type Option } from "@/common/ReactSelect";
import Button from "@/common/Button";

interface PaginationProps<T extends FieldValues = any> {
    pageIndex: number;
    pageCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;

    onFirst: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onLast: () => void;

    perPageOptions: Option[];
    control: Control<T>;
    onPerPageChange: (value: number) => void;
}

const Pagination = <T extends FieldValues>({
    pageIndex,
    pageCount,
    canPreviousPage,
    canNextPage,
    onFirst,
    onPrevious,
    onNext,
    onLast,
    perPageOptions,
    control,
    onPerPageChange
}: PaginationProps<T>) => {

    return (
        <div className="flex items-center justify-between mt-4">

            {/* Per Page */}
            <div className="w-32">
                <Select
                    name={"perPage" as Path<T>}
                    control={control}
                    options={perPageOptions}
                    placeholder="Per Page"
                    onChange={(val: any) => onPerPageChange(val.value)}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">

                <Button
                    onClick={onFirst}
                    disabled={!canPreviousPage}
                    color="gray"
                >
                    <ChevronsLeft size={16} />
                </Button>

                <Button
                    onClick={onPrevious}
                    disabled={!canPreviousPage}
                    color="gray"
                >
                    <ChevronLeft size={16} />
                </Button>

                <span className="text-sm font-medium px-2">
                    Page {pageIndex + 1} of {pageCount}
                </span>

                <Button
                    onClick={onNext}
                    disabled={!canNextPage}
                    color="gray"
                >
                    <ChevronRight size={16} />
                </Button>

                <Button
                    onClick={onLast}
                    disabled={!canNextPage}
                    color="gray"
                >
                    <ChevronsRight size={16} />
                </Button>

            </div>

        </div>
    );
};

export default Pagination;