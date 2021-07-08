# Build Clipboarder from source

Building from source requires an internet connection. Open command prompt and run the commands:

## NodeJS installation Windows

Download and install [NodeJS for Windows](https://nodejs.org/en/download/).

## NodeJS installation Ubuntu

Node/NPM packages are outdated when installating via `apt`. Install latest version via NVM instead:

```bash
# Install NodeJS via NVM installer
$ curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
$ source ~/.profile   
$ nvm install node 

# Check installation
$ node --version
$ npm -v
```

### Build for Windows and Linux

```bash
# Clone repository
$ git clone https://github.com/Erriez/Clipboarder.git
$ cd Clipboarder

# Install NPM packages
$ npm install

# Run
$ npm run start

# Optional: Test electron-builder
$ node_modules/electron-builder/cli.js --help

# Create release on Windows for Windows (NSIS installer)
$ npm run release-windows

# Create release on Linux x64 for Linux (AppImage)
$ npm run release-linux

# Create release on Linux x64 or armv7l for armv7l or Linux (AppImage)
$ npm run release-armv7l

# Create release on Linux x64 or armv7l for arm64 Linux (AppImage)
$ npm run release-arm64
```

## Node clipboard-event package

This project has a dependency on [clipboard-event package](https://github.com/sudhakar3697/node-clipboard-event#readme) to
generate an event when clipboard change is detected. It runs an optimized C application `clipboard-event-handler` in the background.

### Linux: Built from source

The executable flag should be set after installing the clipboard-event package via NPM, otherwise no clipboard changes are detected:

```bash
# Set execute flag
$ chmod +x Clipboarder/node_modules/clipboard-event/platform/clipboard-event-handler-linux
```

The executable must be rebuild from source to support Raspberry Pi (Rasbian).

Build from source for Ubuntu or Rasbian:

```bash
# When this build error occurs:
    clipboard-event-handler-linux.c:4:10: fatal error: X11/extensions/Xfixes.h: No such file or directory
        4 | #include <X11/extensions/Xfixes.h>
        |          ^~~~~~~~~~~~~~~~~~~~~~~~~
    compilation terminated.
# Install system dependency:
$ sudo apt install libxtst-dev

# Build executable
$ cd Clipboarder/node_modules/clipboard-event/platform
$ gcc clipboard-event-handler-linux.c -o clipboard-event-handler-linux -lX11 -lXfixes
```

## Debugging

Open the clipboarder directory with the free [Visual Studio Code](https://code.visualstudio.com/).  
To start debugging, run the `start` script.

## Technical details

The application is build around the popular NodeJS [Electron Boilerplate](https://github.com/szwacz/electron-boilerplate).
Reason is easy development, maintenance and deployment.

NPM dependencies:

* [auto-launch](https://www.npmjs.com/package/auto-launch)
* [clipboard-event](https://www.npmjs.com/package/clipboard-event)
* [electron](https://www.electronjs.org/)
* [electron-builder](https://www.electron.build/)

Clipboard documentation

* [Electron clipboard API](https://www.electronjs.org/docs/api/clipboard)
