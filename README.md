# Clipboarder

## Introduction

This desktop application shares a clipboard between computers via a removable media or cloudstorage.  
This is useful when there is no direct Ethernet connection between the two computers.

### Screenshot Clipboarder on Ubuntu

![Screenshot Clipboard Ubuntu](screenshots/screenshot-clipboarder-ubuntu.png)

## Prerequisites

* Windows or Linux (Raspberry Pi planned)
* No administrator and no root access needed.
* No internet connection required.
* No automatic updates.
* Exchange clipboard between computers via:
  1. USB memory stick, or
  2. Online storage such as Nextcloud

## Installation

Download latest version from the [releases page](https://github.com/Erriez/Clipboarder/releases).

### Windows

Run the setup `clipboarder Setup x.x.x.exe` to start installation.
Desktop and Start menu icons are created automatically.

### Linux

Set execute permission on the file AppImage:

```bash
$ chmod +x clipboarder-x.x.x.AppImage
```

Double click on the AppImage to start, or start from the commandline:

```bash
$ ./clipboarder-x.x.x.AppImage
```

### Set clipboard directory

Set clipboard directory of the USB stick or cloudstorage. This is asked at first launch and can be changed later via the system tray icon `Clipboard Files | Clipboard path`.

### Save/load clipboard

Three system tray clipboard colors indicates clipboard status:

Clipboard directory not found, for example USB stick unmounted:

![Clipboard dir unmounted](resources/clipboard-red.png)

Clipboard changed and not saved:

![Clipboard changed](resources/clipboard-yellow.png)

Clipboard saved:

![Clipboard saved](resources/clipboard-green.png)

### Automatic startup

Enable or disable automatic startup: `Settings | Launch at startup`.

### Remove clipboard files after load

Enable or disable removing clipboard files after load: `Settings | Remove clipboard files after load`.

### Clipboard conversions

Several clipboard conversions are available:

* Lower case
* Upper case
* Linux endlines (LF \n)
* Windows endlines (CR/LF \r\n)
* To plain text (remove formatting)

Note: Conversions are applied directly in the clipboard as text and are not automatically saved.

### Unmounting

Safely unmounting the USB stick is a user responsibility. Unmounting from a menu is planned.

## Build from source

Building from source requires an internet connection. Open command prompt and run the commands:

```bash
# Clone repository
$ git clone https://github.com/Erriez/Clipboarder.git

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

### NO MAC support

Sorry Apple users, you're using a platform which is not compatible with Windows or Linux.

Without Apple hardware it is impossible for developers to build and test applications. 
I'm happy to add MAC support when someone wants to sponsor me by providing a MAC Book Pro.

## MIT License

In simple words: 
* Open source.
* Do what ever you want with the application.
* For personal and commercial usage.
* No warranties.
* Don't like it? -> Don't use it.
* Merge requests are welcome.

## Issues / bugs

Please report [issues here](https://github.com/Erriez/Clipboarder/issues).

## Donations

A [small donation](https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FUPLMV8JNMJTQ) is appreciated, for example to implement MAC support.
