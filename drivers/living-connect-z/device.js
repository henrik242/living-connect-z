'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class DanfossLivingConnectZDevice extends ZwaveDevice {

  async onNodeInit() {
    // Battery — use the built-in capability registration so reports are parsed correctly
    this.registerCapability('measure_battery', 'BATTERY');

    // Thermostat setpoint reports
    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      getOpts: { getOnStart: false },
      report: 'THERMOSTAT_SETPOINT_REPORT',
      reportParser: (report) => {
        if (!report || !report.Level2 || !report['Value (Raw)']) return null;
        const { Precision, Scale, Size } = report.Level2;
        if (Scale !== 0) return null;
        let value = report['Value (Raw)'].readIntBE(0, Size);
        value /= 10 ** Precision;
        this.log('Setpoint report:', value, '°C');
        return value;
      },
    });

    // Thermostat setpoint commands
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

    // On wakeup, actively request fresh status from the device
    this._registerWakeupHandler();

    this.log('Danfoss Living Connect Z has been initialized');
  }

  _registerWakeupHandler() {
    const interval = this.homey.setInterval(() => {
      const wakeupCC = this.node.CommandClass.COMMAND_CLASS_WAKE_UP;
      if (!wakeupCC) return;

      this.homey.clearInterval(interval);
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
    }, 5000);
  }

}

module.exports = DanfossLivingConnectZDevice;
