const { execSync, exec } = require('child_process');
const { logger } = require('../config/logger');

class GammuService {
  constructor() {
    this.available = false;
    this.device = null;
    this._detect();
  }

  _detect() {
    try {
      const res = execSync('gammu-detect 2>/dev/null || echo ""', { timeout: 5000 }).toString();
      if (res.includes('Device')) {
        const lines = res.split('\n');
        for (const line of lines) {
          if (line.includes('device =')) {
            this.device = line.split('=')[1].trim();
            break;
          }
        }
      }
      if (!this.device) {
        // Try to find device directly
        const ls = execSync('ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true', { timeout: 3000 }).toString().trim();
        if (ls) {
          this.device = ls.split('\n')[0].trim();
        }
      }
      if (this.device) {
        const test = execSync(`echo "AT" | timeout 3 microcom -t 1000 ${this.device} 2>/dev/null || echo "OK"`, { timeout: 5000 }).toString();
        this.available = test.includes('OK');
        logger.info(`Gammu: modem detecte sur ${this.device}, disponible: ${this.available}`);
      } else {
        logger.warn('Gammu: aucun modem detecte');
      }
    } catch (err) {
      logger.warn('Gammu: detection impossible', { error: err.message });
      this.available = false;
    }
  }

  async executeUSSD(code) {
    if (!this.available) {
      throw new Error('Aucun modem GSM disponible');
    }
    try {
      const cmd = `gammu --device ${this.device} getussd "${code}" 2>&1`;
      const res = execSync(cmd, { timeout: 60000, encoding: 'utf-8' });
      return {
        success: true,
        response: res.trim(),
        method: 'gammu',
      };
    } catch (err) {
      const output = err.stdout?.toString() || err.message;
      if (output.includes('No response')) {
        return {
          success: true,
          response: 'USSD envoye (pas de reponse immediate)',
          method: 'gammu',
        };
      }
      if (output.includes('TIMEOUT')) {
        return {
          success: false,
          error: 'Timeout USSD',
          method: 'gammu',
        };
      }
      // Try interactive USSD
      try {
        const interactive = execSync(`echo -e "${code}\\n" | timeout 30 gammu --device ${this.device} sendsussd 2>&1`, { timeout: 35000, encoding: 'utf-8' });
        return {
          success: true,
          response: interactive.trim(),
          method: 'gammu-interactive',
        };
      } catch (err2) {
        return {
          success: false,
          error: err2.stdout?.toString()?.trim() || err2.message,
          method: 'gammu',
        };
      }
    }
  }

  async sendSMS(phone, message) {
    if (!this.available) {
      throw new Error('Aucun modem GSM disponible');
    }
    try {
      const cmd = `echo "${message}" | gammu --device ${this.device} sendsms TEXT ${phone} 2>&1`;
      const res = execSync(cmd, { timeout: 30000, encoding: 'utf-8' });
      return { success: true, response: res.trim() };
    } catch (err) {
      return { success: false, error: err.stdout?.toString()?.trim() || err.message };
    }
  }

  getStatus() {
    try {
      const res = execSync(`gammu --device ${this.device} identify 2>&1`, { timeout: 10000, encoding: 'utf-8' });
      return { connected: true, info: res.trim() };
    } catch {
      return { connected: false, info: null };
    }
  }
}

const gammuService = new GammuService();
module.exports = gammuService;
