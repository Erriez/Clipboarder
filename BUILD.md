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

### Build Windows and Linux

```bash
# Clone repository
$ git clone https://github.com/Erriez/Clipboarder.git
$ cd Clipboarder

# Install NPM packages
$ npm install

# Run
$ npm run start

# Create release on Windows (NSIS installer) or Linux (AppImage)
$ npm run release
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
