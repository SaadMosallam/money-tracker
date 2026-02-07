import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/userInitials";

type UserLabelProps = {
  name: string;
  imageUrl?: string | null;
  showAvatar?: boolean;
};

export function UserLabel({
  name,
  imageUrl,
  showAvatar = false,
}: UserLabelProps) {
  if (!showAvatar) {
    return (
      <span className="max-w-[160px] truncate font-medium" title={name}>
        {name}
      </span>
    );
  }

  const initials = getUserInitials(name);

  return (
    <span className="flex items-center gap-2 font-medium whitespace-nowrap" title={name}>
      <Avatar className="h-7 w-7">
        {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="max-w-[140px] truncate">{name}</span>
    </span>
  );
}
