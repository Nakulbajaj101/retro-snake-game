import { User, Ghost, Skull, Smile } from "lucide-react"

interface UserAvatarProps {
    avatarString?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function UserAvatar({ avatarString, className = "", size = "md" }: UserAvatarProps) {
    const defaultColor = '#3b82f6';
    const defaultIcon = 'user';

    const [color, icon] = (avatarString || "").split('|');
    const finalColor = color || defaultColor;
    const finalIcon = icon || defaultIcon;

    const IconComponent = finalIcon === 'ghost' ? Ghost :
        finalIcon === 'skull' ? Skull :
            finalIcon === 'smile' ? Smile : User;

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-16 w-16"
    };

    const iconSizes = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8"
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 border-white/20 shadow-sm ${className}`}
            style={{ backgroundColor: finalColor }}
        >
            <IconComponent className={`${iconSizes[size]} text-white`} />
        </div>
    );
}
