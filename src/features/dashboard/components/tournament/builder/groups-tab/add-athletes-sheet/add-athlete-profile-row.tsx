import type { AthleteProfileData } from '@/contracts/athlete/profile';
import { getBeltLabel } from '@/config/athlete';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface AddAthleteProfileRowProps {
  profile: AthleteProfileData;
  checked: boolean;
  onToggle: () => void;
}

export function AddAthleteProfileRow({
  profile,
  checked,
  onToggle,
}: AddAthleteProfileRowProps) {
  return (
    <label
      className={cn(
        'hover:bg-muted/40 smooth-hover flex cursor-pointer items-start gap-3 px-3 py-2',
        checked && 'bg-muted/30'
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{profile.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {profile.affiliation}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {getBeltLabel(profile.beltLevel)}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {profile.weight}kg
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {profile.gender}
          </Badge>
        </div>
      </div>
    </label>
  );
}
