'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class DanfossLivingConnectZDevice extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapability('measure_battery', 'BATTERY');
    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT');

    this.log('Danfoss Living Connect Z has been initialized');
  }

}

module.exports = DanfossLivingConnectZDevice;
