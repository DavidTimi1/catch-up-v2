import Image from "next/image";

const sizeVariants = {
    "sm": "size-8",
    "md": "size-12",
    "lg": "size-24",
    "xl": "size-32"
}

// 1. Extract the allowed keys from sizeVariants for strict typing
type SizeVariant = keyof typeof sizeVariants;

export const BrandLogo = ({ size = "md" }: { size?: SizeVariant }) => (
    <div className={`${sizeVariants[size]} relative`}>
        <Image
            src="/logo.png" // Replace with your actual logo path
            alt="Brand Logo"
            fill
            priority
            className="object-contain"
        />
    </div>
);