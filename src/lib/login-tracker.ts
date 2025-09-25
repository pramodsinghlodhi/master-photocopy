import { DeviceInfo, LocationInfo } from '@/types/login-history';

export class LoginTracker {
  static getDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    }
    
    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edge')) {
      browser = 'Edge';
    } else if (ua.includes('opr') || ua.includes('opera')) {
      browser = 'Opera';
    }
    
    // Detect OS
    let os = 'Unknown';
    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      os = 'iOS';
    }
    
    return {
      deviceType,
      browser,
      os,
      userAgent
    };
  }
  
  static async getLocationInfo(ip: string): Promise<LocationInfo> {
    try {
      // In production, you would use a service like ipapi.co or similar
      // For now, we'll return basic IP info
      return {
        ip,
        country: 'Unknown',
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      console.error('Failed to get location info:', error);
      return {
        ip,
        country: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown'
      };
    }
  }
  
  static getClientIP(req: any): string {
    // Try to get the real IP address from various headers
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.headers['x-client-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      'Unknown'
    );
  }
  
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static formatSessionDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  }
  
  static getDeviceIcon(deviceType: string): string {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  }
  
  static getBrowserIcon(browser: string): string {
    switch (browser.toLowerCase()) {
      case 'chrome':
        return '🌐';
      case 'firefox':
        return '🦊';
      case 'safari':
        return '🧭';
      case 'edge':
        return '🔷';
      case 'opera':
        return '🎭';
      default:
        return '🌐';
    }
  }
}