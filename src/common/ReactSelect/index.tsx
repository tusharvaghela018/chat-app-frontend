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
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>

            {label && (
                <label className="text-sm font-semibold text-foreground/80 ml-0.5">
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
                                backgroundColor: "hsl(var(--background))",
                                borderColor: error
                                    ? "hsl(var(--destructive))"
                                    : state.isFocused
                                        ? "hsl(var(--primary))"
                                        : "hsl(var(--border))",
                                boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring) / 0.2)" : "none",
                                "&:hover": {
                                    borderColor: error ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                                },
                            }),
                            menu: (base) => ({
                                ...base,
                                zIndex: 9999,
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected
                                    ? "hsl(var(--primary))"
                                    : state.isFocused
                                        ? "hsl(var(--accent))"
                                        : "transparent",
                                color: state.isSelected
                                    ? "hsl(var(--primary-foreground))"
                                    : "hsl(var(--foreground))",
                                "&:active": {
                                    backgroundColor: "hsl(var(--primary))",
                                    color: "hsl(var(--primary-foreground))",
                                },
                            }),
                            singleValue: (base) => ({
                                ...base,
                                color: "hsl(var(--foreground))",
                            }),
                            multiValue: (base) => ({
                                ...base,
                                backgroundColor: "hsl(var(--secondary))",
                                borderRadius: "4px",
                            }),
                            multiValueLabel: (base) => ({
                                ...base,
                                color: "hsl(var(--secondary-foreground))",
                            }),
                            multiValueRemove: (base) => ({
                                ...base,
                                color: "hsl(var(--secondary-foreground))",
                                "&:hover": {
                                    backgroundColor: "hsl(var(--destructive) / 0.1)",
                                    color: "hsl(var(--destructive))",
                                },
                            }),
                            placeholder: (base) => ({
                                ...base,
                                color: "hsl(var(--muted-foreground))",
                            }),
                            input: (base) => ({
                                ...base,
                                color: "hsl(var(--foreground))",
                            }),
                        }}
                    />
                )}
            />

            {error && (
                <p className="text-xs font-medium text-destructive mt-0.5 ml-0.5">
                    {error}
                </p>
            )}

        </div>
    );
};

export default Select;