import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "premium" | "gradient";
    glow?: boolean;
  }
>(({ className, variant = "default", glow = false, ...props }, ref) => {
  const variants = {
    default: "rounded-2xl border border-gray-800/50 bg-gray-900/60 backdrop-blur-xl text-white shadow-xl",
    glass: "rounded-2xl border border-gray-800/30 bg-gray-900/40 backdrop-blur-2xl text-white shadow-2xl",
    premium: "rounded-2xl border border-gray-700/30 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl text-white shadow-2xl",
    gradient: "rounded-2xl border-0 bg-gradient-to-br from-aeroshield-primary/10 via-aeroshield-secondary/5 to-transparent backdrop-blur-xl text-white shadow-2xl ring-1 ring-inset ring-white/5",
  };

  return (
    <div
      ref={ref}
      className={cn(
        variants[variant],
        glow && "shadow-[0_0_30px_rgba(232,53,109,0.15)] hover:shadow-[0_0_50px_rgba(232,53,109,0.25)] transition-shadow duration-500",
        "relative overflow-hidden",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
