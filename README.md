# Danfoss Living Connect Z — Homey App

A Homey SDK v3 app for controlling Danfoss Living Connect Z radiator thermostats via Z-Wave.

## Capabilities

- **target_temperature** — Set the desired temperature (4–28 °C, 0.5° steps)
- **measure_battery** — Battery level reporting

## Installation

```bash
npm install
npx homey app install
```

## Development

```bash
npx homey login
npx homey app run
```

## Pairing

Go to Devices → Add device → select **Danfoss Living Connect Z**, then press the middle button on the thermostat to wake it up.

## Notes

- The Living Connect Z is a battery-powered sleepy device. Commands are queued and delivered on the next wakeup.
- Press the middle button for an immediate wakeup.
- The wakeup interval (default 300 s) can be adjusted in the device's advanced settings.

## License

[MPL-2.0](LICENSE)
