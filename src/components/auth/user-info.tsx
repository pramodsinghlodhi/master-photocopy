'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, Mail, Shield, Clock } from 'lucide-react';

interface UserInfoProps {
  showRole?: boolean;
  showEmail?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserInfo({ 
  showRole = true, 
  showEmail = true, 
  compact = false,
  className 
}: UserInfoProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">Loading user...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-sm text-muted-foreground">
        Not authenticated
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className="h-6 w-6">
          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
          <AvatarFallback className="text-xs">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.name || user.email}</span>
          {showRole && user.role && (
            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
              {user.role}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback>
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {user.name || 'User'}
            </CardTitle>
            <CardDescription>User Information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        )}
        
        {showRole && user.role && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Authenticated</span>
        </div>
      </CardContent>
    </Card>
  );
}