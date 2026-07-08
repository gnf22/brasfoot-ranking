import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string; group?: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={props.id || props.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <select
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          id={props.id || props.name}
          {...props}
        >
          <option value="" disabled hidden>Selecione uma opção</option>
          {(() => {
            const hasGroups = options.some(o => o.group);
            if (!hasGroups) {
              return options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ));
            }
            const groups = options.reduce((acc, opt) => {
              const key = opt.group || 'Outros';
              if (!acc[key]) acc[key] = [];
              acc[key].push(opt);
              return acc;
            }, {} as Record<string, typeof options>);
            
            return Object.entries(groups).map(([groupName, opts]) => (
              <optgroup key={groupName} label={groupName}>
                {opts.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ));
          })()}
        </select>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
