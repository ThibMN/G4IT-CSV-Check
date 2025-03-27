"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, onCheckedChange, ...props }, ref) => {
  const [checked, setChecked] = React.useState(props.checked || false);

  React.useEffect(() => {
    setChecked(props.checked || false);
  }, [props.checked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setChecked(newChecked);
    onCheckedChange?.(newChecked);
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="peer h-4 w-4 opacity-0 absolute"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 rounded border border-gray-300 flex items-center justify-center",
            checked
              ? "bg-blue-500 border-blue-500"
              : "bg-white peer-hover:bg-gray-50"
          )}
        >
          {checked && <CheckIcon className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
