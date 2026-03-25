'use strict';

const Homey = require('homey');

class DanfossLivingConnectZDriver extends Homey.Driver {

  async onInit() {
    this.log('Danfoss Living Connect Z driver has been initialized');
  }

}

module.exports = DanfossLivingConnectZDriver;
