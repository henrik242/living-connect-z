'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class DanfossLivingConnectZDevice extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapabilityListener('target_temperature', async (value) => {
      const cc = this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT;
      if (!cc) {
        throw new Error('Thermostat not reachable — press the middle button to wake it up');
      }

      const temp = Math.round(Math.max(4, Math.min(28, value)) * 2) / 2;
      this.log('Setting setpoint to', temp, '°C');

      cc.THERMOSTAT_SETPOINT_SET({
        Level: { 'Setpoint Type': 'Heating 1' },
        Level2: { Precision: 1, Scale: 0, Size: 2 },
        Value: Buffer.from([Math.trunc(temp), (temp % 1) * 10]),
      }).catch((err) => this.log('Setpoint send:', err.message));
    });

    // CCs are unavailable at init on sleepy devices — poll until first wakeup
    this._pollForCommandClasses();

    this.log('Danfoss Living Connect Z has been initialized');
  }

  _pollForCommandClasses() {
    const registered = { setpoint: false, battery: false, wakeup: false };

    const interval = this.homey.setInterval(() => {
      const setpointCC = this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT;
      const batteryCC = this.node.CommandClass.COMMAND_CLASS_BATTERY;
      const wakeupCC = this.node.CommandClass.COMMAND_CLASS_WAKE_UP;

      if (setpointCC && !registered.setpoint) {
        registered.setpoint = true;
        this.log('Registering setpoint listener');
        setpointCC.on('report', (command, report) => {
          if (command.name !== 'THERMOSTAT_SETPOINT_REPORT') return;
          if (!report || !report.Level2 || !report['Value (Raw)']) return;

          const { Precision, Scale, Size } = report.Level2;
          if (Scale === 0) {
            let value = report['Value (Raw)'].readIntBE(0, Size);
            value /= 10 ** Precision;
            this.log('Setpoint report:', value, '°C');
            this.setCapabilityValue('target_temperature', value).catch(this.error);
          }
        });
      }

      if (batteryCC && !registered.battery) {
        registered.battery = true;
        this.log('Registering battery listener');
        batteryCC.on('report', (command, report) => {
          if (command.name !== 'BATTERY_REPORT') return;
          if (!report || report['Battery Level'] == null) return;

          const level = report['Battery Level'] === 255 ? 0 : report['Battery Level'];
          this.log('Battery report:', level, '%');
          this.setCapabilityValue('measure_battery', level).catch(this.error);
        });
      }

      if (wakeupCC && !registered.wakeup) {
        registered.wakeup = true;
        this.log('Registering wakeup listener');
        wakeupCC.on('report', (command) => {
          if (command.name !== 'WAKE_UP_NOTIFICATION') return;
          this.log('Device woke up — requesting status');

          const bCC = this.node.CommandClass.COMMAND_CLASS_BATTERY;
          const sCC = this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_SETPOINT;
          if (bCC) {
            bCC.BATTERY_GET().catch((err) => this.log('Battery get:', err.message));
          }
          if (sCC) {
            sCC.THERMOSTAT_SETPOINT_GET({
              Level: { 'Setpoint Type': 'Heating 1' },
            }).catch((err) => this.log('Setpoint get:', err.message));
          }
        });
      }

      if (registered.setpoint && registered.battery && registered.wakeup) {
        this.homey.clearInterval(interval);
        this.log('All command class listeners registered');
      }
    }, 5000);
  }

}

module.exports = DanfossLivingConnectZDevice;
