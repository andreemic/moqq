#!/usr/bin/env node
const moqq = new (require('moqq'))();
const yargs = require('yargs');

const ora = require('ora');
const spinner = ora();
moqq.setSpinner(spinner);

// Create commands module.
var commandOptions = {};
var deviceMapping = {} //mapping from lowercase underscore to actual deviceNames 

for (let deviceName of moqq.getDeviceNames()) {
  let _deviceName = deviceName.replace(' ', '_').toLowerCase();
  deviceMapping[_deviceName] = deviceName;
  commandOptions[_deviceName] = {
    describe: `Provide screenshot for ${deviceName}.`,
    type: 'string'
  };
}

const options = yargs
  .usage("$0 [options]", 'Generate mock up from provided screenshots.')
  .options(commandOptions)
  .option('w', {
    alias: 'width',
    default: 1280,
    describe: 'Width of resulting image.',
    type: 'number'
  })
  .option('h', {
    alias: 'height',
    default: 720,
    describe: 'Height of resulting image.',
    type: 'number'
  })
  .option('b', {
    alias: 'background',
    default: 'transparent',
    describe: 'Background of resulting image as a css color string.',
    type: 'string'
  })
  .option('s', {
    alias: 'statusbar',
    default: 'none',
    describe: 'Style of status bar to add (none/light/dark). Currently only supported for vertical iPhone X.',
    type: 'string'
  })
  .option('o', {
    alias: 'output',
    default: './mock-up.png',
    describe: 'File to write resulting image to.',
    type: 'string'
  })
  .help('help').argv;

let screenshots = {}
for (let optionName in options) {
  if (optionName in deviceMapping) {
    let deviceName = deviceMapping[optionName];

    screenshots[deviceName] = options[optionName];
  }
}

// Convert string status bar input to macros
let statusBar;
switch (options.s) {
  case 'light':
    statusBar = moqq.STATUSBAR_LIGHT;
    break;
  case 'dark':
    statusBar = moqq.STATUSBAR_DARK;
    break;
}

if (Object.keys(screenshots).length < 1) {
  spinner.fail(`No screenshot provided for valid device (${Object.keys(deviceMapping).join(', ')}).`);
} else {
  moqq.up({
    screenshots: screenshots,
    resPath: options.o,
    w: options.w,
    h: options.h,
    statusBar: statusBar,
    background: options.b
  }).then((fPath) => {
    if (typeof(fPath) == 'string' && fPath.length > 1) {
      spinner.succeed(`Saved to ${fPath}`);
    }
  });
}
