import React from 'react';
export interface ButtonProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  'default' |
  'primary' |
  'secondary' |
  'outline' |
  'ghost' |
  'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    primary:
    'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow hover:opacity-90',
    secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    outline:
    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90'
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9'
  };
  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  return <button className={combinedClassName} {...props} />;
}