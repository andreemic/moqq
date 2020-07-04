# moqq - minimalistic device mockups.
This package utilizes Jimp to compose device mockups. Currently only mockups with a pc are supported.

In action: <a href="https://andreev.work/projects" target="_blank">andreev.work/projects</a>
### Docs
## Classes

<dl>
<dt><a href="#Moqq">Moqq</a></dt>
<dd><p>Interfacing class</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ImageInput">ImageInput</a> : <code>path</code> | <code>Jimp</code> | <code>ArrayBuffer</code></dt>
<dd></dd>
</dl>

<a name="Moqq"></a>

## Moqq
Interfacing class

<a name="Moqq+up"></a>

### moqq.up(options) ⇒ <code>string</code> \| <code>Jimp</code>
Composes a Jimp image consisting of devices with 
complementary screenshots as declared in options.
Returns path to that image or the Jimp instance.

**Kind**: instance method of [<code>Moqq</code>](#Moqq)  
**Returns**: <code>string</code> \| <code>Jimp</code> - Path to resulting image or resulting Jimp instance  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.screenshots | <code>object.&lt;string, ImageInput&gt;</code> |  | object with deviceNames as keys and paths, ArrayBuffers or Jimps as values. |
| [options.resPath] | <code>string</code> |  | path to resulting image (relative to caller location). |
| [options.w] | <code>number</code> | <code>1280</code> | width of resulting image. |
| [options.h] | <code>number</code> | <code>720</code> | height of resulting image. |
| [options.returnJimp] | <code>boolean</code> | <code>false</code> | If true, a Jimp instance is returned. Otherwise image is saved to resPath. |
| [options.background] | <code>string</code> \| <code>number</code> | <code>&quot;0x00000000&quot;</code> | Background color as css string or hex number (0xrrggbbaa). |
| [options.statusBar] | <code>number</code> | <code></code> | What style status bar to add (moqq.STATUSBAR_LIGHT or moqq.STATUSBAR_DARK). Currently only vertical iPhone X is  supported. |
| [options.paddingX] | <code>number</code> | <code>0.8</code> | Horizontal padding relative to image width (0.0 - 1.0) |
| [options.paddingY] | <code>number</code> | <code>0.8</code> | Vertical padding relative to image height (0.0 - 1.0) |

<a name="ImageInput"></a>


### CLI
```
moqq-up [options]

Generate mock up from provided screenshots.

Options:
  --version         Show version number                                [boolean]
  --pc              Provide screenshot for PC.                          [string]
  --iphone_x        Provide screenshot for iPhone X.                    [string]
  --iphone_6/7/8    Provide screenshot for iPhone 6/7/8.                [string]
  --ipad            Provide screenshot for iPad.                        [string]
  -w, --width       Width of resulting image.           [number] [default: 1280]
  -h, --height      Height of resulting image.           [number] [default: 720]
  -b, --background  Background of resulting image as a css color string.
                                               [string] [default: "transparent"]
  -s, --statusbar   Style of status bar to add (none/light/dark). Currently only
                    supported for vertical iPhone X.  [string] [default: "none"]
  -o, --output      File to write resulting image to.
                                             [string] [default: "./mock-up.png"]
  --help            Show help                                          [boolean
```
### Usage:
Take a screenshot of your website using Chrome DevTools for all devices you need (choose device, Shift+Ctrl+P, type "Capture Screenshot").
Then feed them to the cli:

`moqq-up --pc pc-screenshot.png --iphone_x mobile-screenshot.png -w 800 -h 600 -b transparent -o result.png`
