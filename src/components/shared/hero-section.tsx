import Image from "next/image";
import { cn } from "@/lib/utils";

export function HeroSection({
  title,
  subtitle,
  image,
  children,
  size = "lg",
  imagePriority = true,
}: {
  title: string;
  subtitle?: string;
  image: string;
  children?: React.ReactNode;
  size?: "lg" | "md";
  imagePriority?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden",
        size === "lg" ? "min-h-[560px] py-24" : "min-h-[320px] py-16"
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        priority={imagePriority}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/50 to-navy-900/80" />

      <div className="container-page relative z-10 flex flex-col items-center text-center">
        <h1 className="text-balance font-display text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-balance text-base text-navy-100 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8 w-full max-w-4xl">{children}</div>}
      </div>
    </section>
  );
}
