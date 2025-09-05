import React from 'react';

// Premium, lightweight Suspense fallback with Tailwind animations only
// Drop-in for <Suspense fallback={<SuspenseFallback />}>
export const SuspenseFallback: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-saffron-light/60 via-background to-sky-blue-light/60 dark:from-background dark:via-background dark:to-background p-6 select-none">
      <div className="relative w-full max-w-md">
        {/* Glow background accents */}
        <div className="pointer-events-none absolute -inset-8 blur-2xl opacity-40">
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.saffron.DEFAULT)/30%,transparent_50%),radial-gradient(circle_at_70%_60%,theme(colors.sky\-blue.DEFAULT)/25%,transparent_50%)]" />
        </div>

        <div className="relative rounded-2xl border border-card-border/60 bg-card/70 backdrop-blur-md shadow-medium p-6 md:p-8 transition-transform duration-300 ease-out hover:scale-[1.01] cursor-pointer">
          {/* Centerpiece: Duo rings + core */}
          <div className="mx-auto h-28 w-28 md:h-32 md:w-32 relative">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            {/* Orbiting dots (three, staggered) */}
            <div className="absolute inset-0">
              <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 h-2 w-2 rounded-full bg-primary animate-bounce" />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-secondary animate-bounce [animation-delay:0.15s]" />
              <span className="absolute left-1.5 bottom-1/2 translate-y-1/2 h-2 w-2 rounded-full bg-saffron animate-bounce [animation-delay:0.3s]" />
            </div>
            {/* Core */}
            <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 shadow-inner" />
            {/* Inner rotating triangle (directional hint) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-10 w-10 md:h-12 md:w-12 text-primary/80 animate-spin [animation-duration:2.8s]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l8 20-8-4-8 4 8-20z" fill="currentColor" opacity="0.9" />
              </svg>
            </div>
          </div>

          {/* Shimmering content placeholders */}
          <div className="mt-8 space-y-4">
            <div className="h-4 w-3/4 mx-auto rounded-md bg-muted/60 animate-pulse" />
            <div className="h-3 w-1/2 mx-auto rounded-md bg-muted/50 animate-pulse" />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-lg bg-muted/70 animate-pulse" />
            <div className="h-12 rounded-lg bg-muted/50 animate-pulse" />
          </div>

          {/* Interactive hover glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/10 hover:ring-primary/20 transition" />
        </div>

        {/* Subtle bottom hint dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
};

export default SuspenseFallback;


