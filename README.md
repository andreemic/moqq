# moqq - minimalistic device mockups.
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
