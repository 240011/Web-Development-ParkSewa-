import * as React from "react";

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}
export const FormItem: React.FC<FormItemProps> = ({ className, ...props }) => (
  <div className={cn("space-y-2", className)} {...props} />
);

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}
export const FormLabel: React.FC<FormLabelProps> = ({ className, required, children, ...props }) => (
  <label className={cn("text-sm font-medium", className)} {...props}>
    {children}
    {required && <span className="ml-1 text-[hsl(var(--destructive))]">*</span>}
  </label>
);

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}
export const FormControl: React.FC<FormControlProps> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export const FormMessage: React.FC<FormMessageProps> = ({ className, children, ...props }) => (
  <p className={cn("text-sm font-medium text-destructive", className)} {...props}>
    {children}
  </p>
);
