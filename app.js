'use strict';

const Homey = require('homey');

class DanfossLivingConnectZApp extends Homey.App {

  async onInit() {
    this.log('Danfoss Living Connect Z app has been initialized');
  }

}

module.exports = DanfossLivingConnectZApp;
