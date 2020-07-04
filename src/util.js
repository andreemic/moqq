const path = require('path');
const { PerformanceObserver, performance } = require('perf_hooks');
const fs = require('fs');

const Jimp = require('jimp');

const util = {};

const POS_TOP = 2;
const POS_BOTTOM = 0;
const POS_LEFT = 10;
const POS_RIGHT = 11;
const POS_CENTER = 1;

util.STATUSBAR_LIGHT = 1;
util.STATUSBAR_DARK = 2;

class Composition {
  async create(w, h, bg) {
    this.w = w;
    this.h = h;
    this.image = await new Jimp(w, h, Jimp.cssColorToHex(bg));
    
    return this;
  }

  setBoundingRect(br) {
    this.boundingRect = br;
  }

  /*
   * Composes a device onto this.image.
   *
   * @param {number} xAlign - One of: POS_LEFT, POS_RIGHT, POS_CENTER.
   * @param {number} yAlign - One of: POS_TOP, POS_BOTTOM, POS_CENTER.
   * @param {number} yScale - At 1.0 the device is going to be as high as the bounding box.
   */
  async addDevice(deviceImage, xAlign, yAlign, yScale) {
    if (!(deviceImage instanceof Jimp)) throw new Error(`deviceImage (${deviceImage}) has to be a Jimp instance`);

    let image = this.image;
    let br = this.boundingRect;
    deviceImage.scaleToFit(br.w, br.h * yScale);

    // Calculate offsets for placement on main image.
    let xOffset, yOffset;
    let deviceWidth = deviceImage.bitmap.width;
    let deviceHeight = deviceImage.bitmap.height;
    switch (yAlign) {
      case POS_BOTTOM:
        yOffset = br.y + br.h - deviceHeight;
        break;
      case POS_CENTER:
        yOffset = br.y + (br.h - deviceHeight) / 2;
        break;
      case POS_TOP:
        yOffset = br.y;
        break;
    }

    switch (xAlign) {
      case POS_LEFT:
        xOffset = br.x + (br.w - deviceWidth) * 0.1;
        break;
      case POS_CENTER:
        xOffset = br.x + (br.w - deviceWidth) / 2;
        break;
      case POS_RIGHT:
        xOffset = br.x + (br.w - deviceWidth) * 0.9;
        break;
    }

    // Add shadow
    let shadow = new Jimp(deviceWidth + 40, deviceHeight + 40);
    shadow.blit(deviceImage.clone(),
      20, 20).brightness(-1).opacity(0.1).blur(8);

    image.blit(shadow, xOffset - 20, yOffset - 15);

    // Composite deviceImage on to main image. 
    image.blit(deviceImage, xOffset, yOffset);
  }

}

//Devices defined after ChromeDevTools spec (https://raw.githubusercontent.com/ChromeDevTools/devtools-frontend/master/front_end/emulated_devices/module.json)
util.deviceData = {
  'PC': {
    w: 960,                    // screen width
    h: 540,                    // screen height
    templateFile: 'pc_1.png',  // file with device template
    maskFile: 'pc_1-mask.png', // file with screen mask (same dimensions as templateFile)
    template: null,            // filled with Jimp instance from templateFile in init()
    mask: null,                // filled with Jimp instance of maskFile in init()
    offset: {}                 // filled with coordinates of screen (top-left) on template
  },
  'iPhone X' : {
    w: 375,
    h: 812,
    templateFile: 'iphone_x.png',
    maskFile: 'iphone_x-mask.png',
    statusDarkFile: 'iphone_x-statusdark.png',
    statusLightFile: 'iphone_x-statuslight.png',
    statusDark: null,
    statusLight: null,
    template: null,
    mask: null,
    offset: {}
  }, 
  'iPhone 6/7/8': {
    w: 667,
    h: 375,
    templateFile: 'iphone.png',
    maskFile: 'iphone-mask.png',
    template: null,
    mask: null,
    offset: {}
  },
  'iPad': {
    w: 768,
    h: 1024,
    templateFile: 'ipad.png',
    maskFile: 'ipad-mask.png',
    template: null,
    mask: null,
    offset: {}
  }
};

function imagePath(fPath) {
      return path.join(__dirname, '../img/', fPath);
}

/*
 * Reads in mask and template files as Jimp instances and
 * calculates offsets for later screenshot placement. Stores all of these in util.deviceData.
 *
 * @returns {Promise} Promise which resolves once initializon is complete.
 */
util.init = async () => {
  for (let deviceName in util.deviceData) {
    try {
      let device = util.deviceData[deviceName];

      let templatePath = imagePath(device.templateFile);
      let deviceTemplate = await Jimp.read(templatePath).catch(err => {
        throw Error(`Can't read device template at ${templatePath}`);
      });
      device.template = deviceTemplate;

      if (device.statusDarkFile && device.statusLightFile) {
        let darkPath = imagePath(device.statusDarkFile);
        let darkStatus = await Jimp.read(darkPath).catch(err => {
          throw Error(`Can't read dark status bar at ${darkPath}`);
        });
        device.statusDark = darkStatus;

        let lightPath = imagePath(device.statusLightFile);
        let lightStatus = await Jimp.read(lightPath).catch(err => {
          throw Error(`Can't read dark status bar at ${lightPath}`);
        });
        device.statusLight = lightStatus;
      }

      let maskPath = (path.join(__dirname, '../img/', device.maskFile));
      let deviceMask = await Jimp.read(maskPath).catch(err => {
        throw Error(`Can't read device mask at ${maskPath}`);
      });
      device.mask = deviceMask;

      device.offset = extractOffsets(deviceMask);
    } catch (e) {
      throw new Error(`Couldn't initalize ${deviceName}: ${e.message}`);
    }
  }
};

/*
 * Searches coordinates of most top-left non-black pixel on mask.
 * This is the point at which the screenshot is placed inside template.
 */
function extractOffsets(mask) {
  let topLeftPixel = {
    x: Infinity,
    y: Infinity
  };
  mask.scan(0, 0, mask.bitmap.width, mask.bitmap.height, function(x, y, idx) {
    // x, y is the position of this pixel on the image
    // idx is the position start position of this rgba tuple in the bitmap Buffer
    // rgba values run from 0 - 255
    var red = this.bitmap.data[idx];
    if (red > 0) {
      if (x < topLeftPixel.x) {
        topLeftPixel.x = x;
      } 
      if (y < topLeftPixel.y) {
        topLeftPixel.y = y;
      }
    } 
  });

  return topLeftPixel;
}

/*
 * Composes screenshots into a final mockup image.
 * 
 * @param {object.<string, Jimp>} screenshots - Has device names as keys and Jimp images as values.
 * 
 * @returns {Jimp} Image composed from screenshots.
 */
util.compose = async (w, h, screenshots, bg, statusBar, paddingX, paddingY, spinner) => {
  const start = performance.now();
  if (spinner) {
    spinner.text = 'Getting ready';
  }

  let composition = await (new Composition()).create(w, h, bg);

  let boundingRect = {
    x: Math.round(w * 0.1),
    y: Math.round(h * 0.075),
    w: Math.round(w * 0.8),
    h: Math.round(h * 0.85)
  };
  composition.setBoundingRect(boundingRect);

  if ('PC' in screenshots) { 
    let device = util.deviceData['PC'];
    let screenshot = screenshots['PC'];

    // Scale boundingRect to fit perfectly around 
    // PC.
    let pcWidth = device.template.bitmap.width;
    let pcHeight = device.template.bitmap.height;
    let pcAspect = pcWidth / pcHeight;
    let brAspect = boundingRect.w / boundingRect.h;

    if (h < w) {
      boundingRect.h = paddingY * h;
      boundingRect.w = boundingRect.h * pcAspect;
    } else {
      boundingRect.w = paddingX * w;
      boundingRect.h = boundingRect.w / pcAspect;
    }
    boundingRect.y = Math.round((h - boundingRect.h) / 2);
    boundingRect.x = Math.round((w - boundingRect.w) / 2);
    composition.setBoundingRect(boundingRect);

    if (spinner) {
      spinner.text = 'Creating PC';
    }
    let deviceImage = await util.composeDevice('PC', screenshot);

    if (spinner) {
      spinner.text = 'Composing PC into image';
    }
    await composition.addDevice(deviceImage, POS_CENTER, POS_CENTER, 1); 
  }
  if ('iPad' in screenshots) {
    let screenshot = screenshots['iPad'];

    if (spinner) {
      spinner.text = 'Creating iPad';
    }
    let deviceImage = await util.composeDevice('iPad', screenshot)

    if (spinner) {
      spinner.text = 'Composing iPad into image';
    }
    await composition.addDevice(deviceImage, POS_LEFT, POS_BOTTOM, 0.7); 
    devicePromises.push(promise);
  }
  if ('iPhone X' in screenshots) {
    let screenshot = screenshots['iPhone X'];

    if (spinner) {
      spinner.text = 'Creating iPhone X';
    }
    // To-do: Add status bar appropriate to screenshot.
    let deviceImage = await util.composeDevice('iPhone X', screenshot, statusBar)

    if (spinner) {
      spinner.text = 'Composing iPhone X into image';
    }
    await composition.addDevice(deviceImage, POS_RIGHT, POS_BOTTOM, 0.6); 
  }
  if ('iPhone 6/7/8' in screenshots) {
    let screenshot = screenshots['iPhone 6/7/8'];

    if (spinner) {
      spinner.text = 'Creating iPhone 6/7/8';
    }
    let deviceImage = await util.composeDevice('iPhone 6/7/8', screenshot);

    if (spinner) {
      spinner.text = 'Composing iPhone 6/7/8 into image';
    }
    await composition.addDevice(deviceImage, POS_RIGHT, POS_BOTTOM, 0.58); 
  }

  const end = performance.now();
  return composition.image;
}

/*
 * Composes device from device name and screenshot.
 *
 * @param {string} deviceName - Device name (see moqq.getDeviceNames())
 * @param {Jimp|string|ArrayBuffer} - Jimp instance, file path, or ArrayBuffer 
 *                                    of screenshot to compose.
 * @returns {Jimp} Image of device containing screenshot.
 */
util.composeDevice = async (deviceName, screenshot, addStatusBar) => {
    let device = util.deviceData[deviceName];
    if (!device || !device.template || !device.mask) {
      throw new Error(`${deviceName} is not a known device.`);
    }
    if (!screenshot) {
      throw new Error(`Can't compose a device image without a screenshot!`);
    }

    if (!(screenshot instanceof Jimp)) {
      if (screenshot instanceof ArrayBuffer) {
        screenshot = await Jimp.read(screenshot);
      } else if (typeof(screenshot) == 'string') {
        // Read screenshot from file.
        try {
          fPath = path.resolve(screenshot);
        } catch(e) {
          throw new Error(`No valid path provided for ${deviceName}`);
          return null;
        }

        screenshot = await Jimp.read(fPath).catch(err => {
          throw new Error(`Can't read picture at ${fPath}`)
        });
      } else {
        throw new Error(`Screenshot inputs (${screenshot}) have to be Jimp instances,
          path strings, or ArrayBuffers`);
      }
    }

    let template = device.template.clone(); 
    let mask = device.mask.clone(); 
    let statusBar;
    if (addStatusBar == util.STATUSBAR_LIGHT) {
      statusBar = device.statusLight;
    } else if (addStatusBar == util.STATUSBAR_DARK) {
      statusBar = device.statusDark;
    }
    
    // Apply mask.
    mask.autocrop();
    let maskW = mask.bitmap.width;
    let maskH = mask.bitmap.height;
    screenshot.cover(maskW, maskH);


    // Flip to horizontal if needed.
    let screenshotWidth = screenshot.bitmap.width;
    let screenshotHeight = screenshot.bitmap.height;
    let screenshotAspect = screenshotWidth / screenshotHeight;
    let screenAspect = maskW / maskH;
    let statusBarH = 0;
    if (screenAspect < 1 && screenshotAspect > 1 && !statusBar) {
      // Screen vertical but screenshot horizontal
      mask.rotate(-90);
      template.rotate(-90);
      maskW = mask.bitmap.width;
      maskH = mask.bitmap.height;
      let temp = device.offset.x;
      device.offset.x = device.offset.y;
      device.offset.y = temp;

      screenshot.mask(mask);
    } else if (statusBar) {
      // Add status bar if vertical and status bar provided.
      let clonedBar = await new Jimp(statusBar.bitmap.width, statusBar.bitmap.height);
      clonedBar.blit(statusBar, 0, 0);
      clonedBar.autocrop(0.0002, false);
      statusBarH = clonedBar.bitmap.height;

      template.blit(statusBar, 0, 0);

      let shiftedScreenshot = await new Jimp(maskW, maskH + statusBarH);
      shiftedScreenshot.blit(screenshot, 0, statusBarH);
      let shiftedMask = shiftedScreenshot.clone().brightness(-1).blit(mask, 0, 0);
      shiftedScreenshot.mask(shiftedMask, 0, 0);
      screenshot = shiftedScreenshot;
    } else {
      screenshot.mask(mask);
    }


    // Composite screenshot into template.
    template.composite(screenshot, device.offset.x, device.offset.y, {
      mode: Jimp.BLEND_DESTINATION_OVER
    });

    return template;
}

/*
 * Writes image to rootDir as a file with name fName.
 *
 * @param {Jimp} image - Image to be written.
 * @param {string} fPath - File path to write to.
 *
 * @returns {string} path - Relative path to written image file.
 */
util.writeImage = async (image, fPath) => {

  let _fPath = path.resolve(fPath);
  await image.writeAsync(_fPath).catch(err => {
    throw new Error(`Couldn't write image to ${_fPath}: ${err}`);
    _fPath = null;
  });

  return _fPath ? fPath : null;
};

module.exports = util;

