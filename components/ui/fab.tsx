import * as React from "react";
import { Pressable, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const fabVariants = cva(
  "absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full shadow-2xl",
  {
    variants: {
      variant: {
        default: "bg-primary shadow-primary/20",
        secondary: "bg-secondary shadow-black/50",
        destructive: "bg-destructive shadow-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface FABProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof fabVariants> {
  children: React.ReactNode;
}

const FAB = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  FABProps
>(({ className, variant, children, ...props }, ref) => {
  return (
    <Pressable
      className={cn(fabVariants({ variant, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </Pressable>
  );
});
FAB.displayName = "FAB";

export { FAB, fabVariants };

