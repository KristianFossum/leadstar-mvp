import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import type { UserProfile } from '../../types/dashboard';

interface UserProfileCardProps {
  profile: UserProfile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leadership Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.role}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Personality Type</h4>
          <Badge variant="secondary">{profile.personality}</Badge>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Core Values</h4>
          <div className="flex flex-wrap gap-2">
            {profile.values.map((value, index) => (
              <Badge key={index} variant="outline">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
