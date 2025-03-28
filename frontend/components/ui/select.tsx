"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Composant Select simplifié sans dépendance à Radix UI
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative w-full">
      {children}
    </div>
  );
};

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950",
      className
    )}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
);

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, children }) => {
  return <span>{children || placeholder}</span>;
};

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

const SelectContent: React.FC<SelectContentProps> = ({ className, children }) => {
  return (
    <div className={cn(
      "absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg",
      className
    )}>
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className, onClick }) => {
  return (
    <div
      role="option"
      onClick={onClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
