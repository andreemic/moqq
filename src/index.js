const util = require('./util.js');

/** Interfacing class **/
class Moqq {
  constructor() {
    this.initPromise = this.util.init();
  }

  setSpinner(spinner) {
    this.spinner = spinner;
  }

  util = util;

  /**
   * @typedef ImageInput 
   * Images can be input as paths, Jimp files or ArrayBuffers.
   * @type {path|Jimp|ArrayBuffer}
   */

  /**
   * Composes a Jimp image consisting of devices with 
   * complementary screenshots as declared in options.
   * Returns path to that image or the Jimp instance.
   *
   * @param {object} options
   * @param {object.<string, ImageInput>} options.screenshots - object with deviceNames as keys and paths, ArrayBuffers or Jimps as values.
   * @param {string} [options.resPath] - path to resulting image (relative to caller location).
   * @param {number} [options.w=1280] - width of resulting image.
   * @param {number} [options.h=720] - height of resulting image.
   * @param {boolean} [options.returnJimp=false] - If true, a Jimp instance is returned. Otherwise image is saved to resPath.
   * @param {string|number} [options.background=0x00000000] - Background color as css string or hex number (0xrrggbbaa).
   * @param {number} [options.statusBar=null] - What style status bar to add (moqq.STATUSBAR_LIGHT or moqq.STATUSBAR_DARK). Currently only vertical iPhone X is  supported. 
   * @param {number} [options.paddingX=0.8] - Horizontal padding relative to image width (0.0 - 1.0)
   * @param {number} [options.paddingY=0.8] - Vertical padding relative to image height (0.0 - 1.0)
   *
   * @returns {string|Jimp} Path to resulting image or resulting Jimp instance
   */
   async up(options) {
    // Make sure we are initialized
    await this.initPromise;

    if (!options.screenshots || Object.keys(options.screenshots).length < 1 ) throw new Error('options.screenshots is required');

    if (this.spinner) {
      this.spinner.start();
    }

    let image = await this.util.compose(options.w || 1280, options.h || 720, 
      options.screenshots, options.background || 0x00000000, 
      options.statusBar || null, options.paddingX || 0.8, 
      options.paddingY || 0.8, this.spinner);


    if (options.returnJimp) {
       if (this.spinner) {
         this.spinner.stop();
       }
      return image;
    } else { 
      if (this.spinner) {
        this.spinner.text = 'Writing image';
      }
      let path = this.util.writeImage(image, options.resPath);
      this.spinner.stop();
      return path;
    }
  }

  /*
   * Returns all possible deviceNames.
   *
   * @returns {Array<string>}
   */
  getDeviceNames() { 
    return Object.keys(this.util.deviceData);
  }

  async composeDevice() {
    await this.initPromise;
    return this.util.composeDevice;
  }
  STATUSBAR_LIGHT = this.util.STATUSBAR_LIGHT;
  STATUSBAR_DARK = this.util.STATUSBAR_DARK;
}

module.exports = Moqq;
