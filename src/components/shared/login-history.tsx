'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Monitor, Smartphone, Tablet, MapPin, Clock, Activity } from 'lucide-react';
import { LoginSession, LoginHistoryStats } from '@/types/login-history';
import { LoginTracker } from '@/lib/login-tracker';

interface LoginHistoryProps {
  userId: string;
  userType: 'agent' | 'customer';
}

export default function LoginHistory({ userId, userType }: LoginHistoryProps) {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [stats, setStats] = useState<LoginHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId,
        userType,
        limit: '50',
        activeOnly: activeTab === 'active' ? 'true' : 'false'
      });

      const response = await fetch(`/api/login-history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch login history');
      }

      const data = await response.json();
      
      if (data.success) {
        setSessions(data.data.sessions);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch login history');
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, [userId, userType, activeTab]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading login history: {error}</p>
            <Button onClick={fetchLoginHistory} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">All login sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">Currently signed in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueDevices}</div>
              <p className="text-xs text-muted-foreground">Different devices used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageSessionDuration > 0 
                  ? LoginTracker.formatSessionDuration(stats.averageSessionDuration)
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">Average duration</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                A record of devices that have signed into this account.
              </CardDescription>
            </div>
            <Button
              onClick={fetchLoginHistory}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="active">Active Only</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <LoginHistoryTable sessions={sessions} loading={loading} getDeviceIcon={getDeviceIcon} formatRelativeTime={formatRelativeTime} />
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <LoginHistoryTable sessions={sessions} loading={loading} getDeviceIcon={getDeviceIcon} formatRelativeTime={formatRelativeTime} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface LoginHistoryTableProps {
  sessions: LoginSession[];
  loading: boolean;
  getDeviceIcon: (deviceType: string) => JSX.Element;
  formatRelativeTime: (date: Date) => string;
}

function LoginHistoryTable({ sessions, loading, getDeviceIcon, formatRelativeTime }: LoginHistoryTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Loading login history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No login history found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Login Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                {getDeviceIcon(session.deviceInfo.deviceType)}
                <div>
                  <div className="font-medium">
                    {session.deviceInfo.browser} on {session.deviceInfo.os}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {session.deviceInfo.deviceType}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {session.location.city || 'Unknown'}, {session.location.country || 'Unknown'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {session.location.ip}
              </div>
            </TableCell>
            <TableCell>
              <div>{formatRelativeTime(session.loginTime)}</div>
              <div className="text-xs text-muted-foreground">
                {session.loginTime.toLocaleString()}
              </div>
            </TableCell>
            <TableCell>
              {session.sessionDuration ? (
                <span>{LoginTracker.formatSessionDuration(session.sessionDuration)}</span>
              ) : (
                <span className="text-muted-foreground">Active</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={session.isActive ? "secondary" : "outline"}>
                {session.isActive ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                    Active
                  </>
                ) : (
                  'Ended'
                )}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}