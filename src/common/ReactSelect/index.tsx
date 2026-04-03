import ReactSelect, { type Props as ReactSelectProps } from "react-select";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

export interface Option {
    label: string;
    value: string | number;
}

interface SelectProps<T extends FieldValues = any> extends Partial<ReactSelectProps> {
    label?: string;
    name: Path<T>;
    control: Control<T>;
    options: Option[];
    error?: string;
    placeholder?: string;
    containerClassName?: string;
    selectClassName?: string;
    loading?: boolean;
    disabled?: boolean;
    isMulti?: boolean;
}

const Select = <T extends FieldValues>({
    label,
    name,
    control,
    options,
    error,
    placeholder = "Select option",
    containerClassName = "",
    selectClassName = "",
    loading = false,
    disabled = false,
    isMulti = false,
    ...props
}: SelectProps<T>) => {
    const isDisabled = disabled || loading;

    return (
        <div className={`flex flex-col gap-1 ${containerClassName}`}>

            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <ReactSelect
                        {...field}
                        {...props}
                        options={options}
                        isMulti={isMulti}
                        isDisabled={isDisabled}
                        isLoading={loading}
                        placeholder={placeholder}
                        className={selectClassName}
                        classNamePrefix="react-select"
                        onChange={(val) => field.onChange(val)}
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                minHeight: "42px",
                                borderRadius: "8px",
                                borderColor: error
                                    ? "#ef4444"
                                    : state.isFocused
                                        ? "#3b82f6"
                                        : "#d1d5db",
                                boxShadow: "none",
                                "&:hover": {
                                    borderColor: "#3b82f6",
                                },
                            }),
                            menu: (base) => ({
                                ...base,
                                zIndex: 9999,
                            }),
                        }}
                    />
                )}
            />

            {error && (
                <p className="text-sm text-red-500">
                    {error}
                </p>
            )}

        </div>
    );
};

export default Select;