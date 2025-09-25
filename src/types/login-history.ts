export interface LoginSession {
  id: string;
  userId: string;
  userType: 'agent' | 'customer';
  deviceInfo: {
    deviceType: string; // 'desktop' | 'mobile' | 'tablet'
    browser: string;
    os: string;
    userAgent: string;
  };
  location: {
    ip: string;
    country?: string;
    city?: string;
    timezone?: string;
  };
  loginTime: Date;
  logoutTime?: Date;
  isActive: boolean;
  sessionDuration?: number; // in minutes
}

export interface LoginHistoryFilters {
  userType?: 'agent' | 'customer';
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
  deviceType?: string;
}

export interface LoginHistoryStats {
  totalSessions: number;
  activeSessions: number;
  uniqueDevices: number;
  averageSessionDuration: number;
  mostUsedDevice: string;
  mostUsedBrowser: string;
}

export interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  userAgent: string;
}

export interface LocationInfo {
  ip: string;
  country?: string;
  city?: string;
  timezone?: string;
}