import Image from "next/image";
import { cn } from "@/lib/utils";

export const BRAND_ASSETS = {
  logo: "/branding/centsy-logo-transparent.png",
  icon: "/branding/centsy-icon.png",
} as const;

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { full: "h-7", icon: "size-7" },
  md: { full: "h-9", icon: "size-9" },
  lg: { full: "h-12", icon: "size-12" },
};

export function Logo({
  className,
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const s = sizeMap[size];

  if (!showWordmark) {
    return (
      <Image
        src={BRAND_ASSETS.icon}
        alt="Centsy"
        width={512}
        height={512}
        className={cn("shrink-0 object-contain", s.icon, className)}
        priority
      />
    );
  }

  return (
    <Image
      src={BRAND_ASSETS.logo}
      alt="Centsy"
      width={480}
      height={120}
      className={cn("w-auto shrink-0 object-contain object-left", s.full, className)}
      priority
    />
  );
}
