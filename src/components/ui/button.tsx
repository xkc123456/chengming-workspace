import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; asChild?: boolean };
export function Button({ className = "", size, asChild, children, ...props }: Props) {
  if (asChild && React.isValidElement(children)) return React.cloneElement(children, { className } as Record<string, string>);
  return <button className={className} {...props}>{children}</button>;
}
