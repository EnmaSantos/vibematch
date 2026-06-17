import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type VibeMatchLogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  priority?: boolean;
};

export default function VibeMatchLogo({
  href = "/",
  className,
  markClassName,
  textClassName,
  priority = false,
}: VibeMatchLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-2 font-black text-[#fff8ee]",
        className,
      )}
    >
      <Image
        src="/vibematch-logo.svg"
        alt=""
        width={36}
        height={36}
        priority={priority}
        className={cn("size-9 shrink-0", markClassName)}
      />
      <span className={cn("leading-none", textClassName)}>VibeMatch</span>
    </Link>
  );
}
