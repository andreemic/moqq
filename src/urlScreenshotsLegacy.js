// index.js
screenshots = await util.screenshotsFromURL(options.url, options.devices);

// util.js
/*
 * Queries url and generates screenshots for each device in deviceList.
 *
 * @param {string} url - Url to generate screenshots of.
 * @param {Array.<string>} deviceList - List of device names for which to generate screenshots.
 */
util.screenshotsFromURL = async (url, deviceList) => {
  // For each device:
  // 1. Take screenshot with url-to-screenshot.
  //    Use screen size from deviceSizes.
  // 2. Read resulting Buffer into a Jimp image

  let deviceScreenshots = {};

  for (let device of deviceList) {
    // Make screenshot
    let screenshot = await makeScreenshot(url, device);
    let { w, h } = deviceData[device];
    screenshot.cover(w, h);
    deviceScreenshots[device] = screenshot;
  }
  
  return deviceScreenshots;
};

async function makeScreenshot(url, device) {
  let options = {};
  if (captureWebsite.devices.indexOf(device) != -1) {
    // Emulate device
    options.emulateDevice = device;
  } else if (deviceData[device]) {
    // Set custom options
    let { w, h, userAgent } = deviceData[device]
    options.width = w;
    options.height = h;
    options.userAgent = userAgent;
  } else {
    throw Error(`${device} is not a known device`);
    return null;
  }

  return captureWebsite.buffer(url, options).then(Jimp.read).catch(err => { 
    throw new Error(`Can't read screenshot buffer from ${url}`)
  });
}

