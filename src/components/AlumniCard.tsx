import React from 'react';
import { Alumni } from '@/types/alumni';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface AlumniCardProps {
  alumni: Alumni;
}

const AlumniCard: React.FC<AlumniCardProps> = ({ alumni }) => {
  const initials = alumni.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          {alumni.profilePicture ? (
            <AvatarImage src={alumni.profilePicture} alt={alumni.name} />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{alumni.name}</CardTitle>
          <CardDescription className="text-sm">
            {alumni.position} at {alumni.company}
          </CardDescription>
          <div className="text-sm text-muted-foreground mt-1">
            Class of {alumni.graduationYear} • {alumni.location}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4">{alumni.bio}</p>
        <div className="flex flex-wrap gap-1.5">
          {alumni.skills.map((skill, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlumniCard;
