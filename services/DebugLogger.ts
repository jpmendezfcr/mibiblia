import Constants from 'expo-constants';
import * as Device from 'expo-device';

interface LogData {
  type: 'info' | 'error' | 'debug';
  message: string;
  timestamp: string;
  deviceInfo: {
    brand: string | null;
    manufacturer: string | null;
    modelName: string | null;
    osName: string | null;
    osVersion: string | null;
    appVersion: string | null;
  };
}

class DebugLogger {
  private static API_URL = 'https://mibiblia.click/api/debug_logger.php';

  private static async getDeviceInfo() {
    return {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      appVersion: Constants.expoConfig?.version || null,
    };
  }

  private static async sendLog(data: LogData) {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send log:', await response.text());
      }
    } catch (error) {
      console.error('Error sending log:', error);
    }
  }

  static async log(type: LogData['type'], message: string) {
    const logData: LogData = {
      type,
      message,
      timestamp: new Date().toISOString(),
      deviceInfo: await this.getDeviceInfo(),
    };

    await this.sendLog(logData);
  }

  static async info(message: string) {
    await this.log('info', message);
  }

  static async error(message: string) {
    await this.log('error', message);
  }

  static async debug(message: string) {
    await this.log('debug', message);
  }
}

export default DebugLogger;
