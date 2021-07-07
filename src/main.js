// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows, only a system tray icon with context menu.

import fs from "fs";
import path from "path";
import { app, clipboard, dialog, Menu, shell, Tray } from "electron";
import clipboardListener from "clipboard-event";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
import { exception } from "console";
import { exit } from "process";

// Automatic startup
const AutoLaunch = require('auto-launch');

// User application settings
const Settings = require('./settings.js');

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

// Resources path
const resourcesPath = path.join(app.getAppPath(), 'resources');

// Global variables
const websiteGithub = 'https://github.com/Erriez/Clipboarder';
const websiteGithubIssues = 'https://github.com/Erriez/Clipboarder/issues';
const websiteGithubReleases = 'https://github.com/Erriez/Clipboarder/releases';
const websiteDonation = 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FUPLMV8JNMJTQ';
const clipboardFilename = 'clipboard';

let autoLaunchEnabled = false;
let clipboardMounted = false;
let clipboardPathLast = '';
let clipboardTXTFile = '';
let clipboardHTMLFile = '';
let clipboardRTFFile = '';
let clipboardPNGFile = '';
let executablePath = '';

let autoLauncher = null;
let tray = null;

// Instantiate settings class
const settings = new Settings({
  configName: 'user-preferences',
  defaults: {
    firstLaunch: 0,
    launchCount: 1,
    donated: false,
    clipboardPath: '',
    loadOnMount: false,
    removeAfterLoad: false,
    showMessages: true,
  }
});

// Get absolute path executable
if (process.platform === 'linux') {
  // Linux .AppImage started
  executablePath = process.env.APPIMAGE;
} else if (process.platform === 'win32') {
  // Windows .exe started
  executablePath = process.env.PORTABLE_EXECUTABLE_FILE;
} else {
  executablePath = '';
  console.log('Error: platform ' + process.platform + ' not supported');
  exit(1);
}

// Check single instance of the application
if (!app.requestSingleInstanceLock()) {
  console.log('Clipboarder is already running.');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Clipboarder',
      message: 'Clipboarder is already running.',
      detail: 'Please have a look at the system tray icon.',
      buttons: ['OK']
    });
  });
}

// Configure auto-launch
function initAutoLauncher()
{
  autoLauncher = new AutoLaunch({
    name: 'Clipboarder',
    path: executablePath
  });

  // Get auto-launch status once at startup
  autoLauncher.isEnabled()
    .then(function(isEnabled) {
      autoLaunchEnabled = isEnabled;

      // Update system tray icon
      systemTray(false);
    })
    .catch(function(err) {
      console.log('Auto-launch error: ' + err);
    });
}

function initClipboardFileMonitor()
{
  // Set initial mount state clipboard path
  clipboardMounted = fs.existsSync(settings.get('clipboardPath'));
}

function initClipboardMonitor()
{
  // To start listening for clipboard changes
  clipboardListener.startListening();

  clipboardListener.on('change', () => {
      console.log('Clipboard changed');

      // Update system tray icon
      systemTray(false);
  });
}

function isClipboardFileAvailable() {
  if (fs.existsSync(clipboardTXTFile)) {
    return true;
  }
  if (fs.existsSync(clipboardHTMLFile)) {
    return true;
  }
  if (fs.existsSync(clipboardRTFFile)) {
    return true;
  }
  if (fs.existsSync(clipboardPNGFile)) {
    return true;
  }
  return false;
}

function isClipboardEmpty()
{
  // Check if clipboard contains any format
  return clipboard.availableFormats().length === 0;
}

function loadSettings()
{
  // Load clipboard path from settings
  const clipboardPath = settings.get('clipboardPath');

  // Clipboard files
  clipboardTXTFile = path.join(clipboardPath, clipboardFilename + '.txt');
  clipboardHTMLFile = path.join(clipboardPath, clipboardFilename + '.html');
  clipboardRTFFile = path.join(clipboardPath, clipboardFilename + '.rtf');
  clipboardPNGFile = path.join(clipboardPath, clipboardFilename + '.png');

  // Monitor presence clipboard directorye
  if (clipboardPathLast !== clipboardPath) {
    // Unwatch previous clipboard directroy
    if (clipboardPathLast) {
      console.log('Unwatching ' + clipboardPathLast);
      fs.unwatchFile(clipboardPathLast);
      clipboardPathLast = clipboardPath;
    }

    // Watch clipboard directory
    fs.watchFile(clipboardPath, { interval: 2000 }, function (event, filename) {
      if (fs.existsSync(clipboardPath)) {
        //console.log('Clipboard dir \'' + clipboardPath + '\' found');

        // Automatically load clipboard from file
        if (clipboardMounted === false) {
          if (settings.get('loadOnMount') && isClipboardFileAvailable()) {
            console.log('Load clipboard as clipboard dir restored');
            loadClipboard();
          } else {
            systemTray(false);
          }
        }

        clipboardMounted = true;
      } else {
        //console.log('Warning: Clipboard dir \'' + clipboardPath + '\' not found');
        systemTray(false);
        clipboardMounted = false;
      }
    });
  }
}

function saveClipboard()
{
  // Get clipboard formats
  const clipboardFormats = clipboard.availableFormats();

  // Save clipboard data
  try {
    console.log('Saving clipboard types: ' + clipboardFormats);

    // Clipboard TXT
    if (clipboardFormats.includes('text/plain')) {
      fs.writeFileSync(clipboardTXTFile, clipboard.readText(), function (err) {
        if (err) throw err;
      });
    } else {
      if (fs.existsSync(clipboardTXTFile)) {
        fs.unlinkSync(clipboardTXTFile);
      }
    }

    // Clipboard HTML
    if (clipboardFormats.includes('text/html')) {
      fs.writeFileSync(clipboardHTMLFile, clipboard.readHTML(), function (err) {
        if (err) throw err;
      });
    } else {
      if (fs.existsSync(clipboardHTMLFile)) {
        fs.unlinkSync(clipboardHTMLFile);
      }
    }

    // Clipboard RTF
    if (clipboardFormats.includes('text/rtf')) {
      fs.writeFileSync(clipboardRTFFile, clipboard.readRTF(), function (err) {
        if (err) throw err;
      });
    } else {
      if (fs.existsSync(clipboardRTFFile)) {
        fs.unlinkSync(clipboardRTFFile);
      }
    }

    // Clipboard PNG
    if (clipboardFormats.includes('image/png')) {
      fs.writeFileSync(clipboardPNGFile, clipboard.readImage().toPNG(), function (err) {
        if (err) throw err;
      });
    } else {
      if (fs.existsSync(clipboardPNGFile)) {
        fs.unlinkSync(clipboardPNGFile);
      }
    }

    // Update system tray icon
    systemTray(true);

    console.log('Saved clipboard data!');

    if (settings.get('showMessages')) {
      dialog.showMessageBoxSync({
        type: 'info',
        title: 'Clipboarder',
        message: 'Clipboard saved!',
        buttons: ['OK']
      });
    }
  } catch(error) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Clipboarder',
      message: 'Clipboard save error',
      detail: 'Could not save clipboard to \'' + clipboardDataFile + '\'',
      buttons: ['OK']
    });
  }
}

function removeClipboardFiles()
{
  const clipboardPath = settings.get('clipboardPath');

  // Remove clipboard files
  try {
    if (clipboardPath && fs.existsSync(clipboardPath)) {
      if (fs.existsSync(clipboardTXTFile)) {
        fs.unlinkSync(clipboardTXTFile);
      }

      if (fs.existsSync(clipboardHTMLFile)) {
        fs.unlinkSync(clipboardHTMLFile);
      }

      if (fs.existsSync(clipboardRTFFile)) {
        fs.unlinkSync(clipboardRTFFile);
      }

      if (fs.existsSync(clipboardPNGFile)) {
        fs.unlinkSync(clipboardPNGFile);
      }
    }

    console.log('Clipboard files removed');
  } catch(error) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Clipboarder',
      message: 'Error',
      detail: 'Could not remove clipboard files.',
      buttons: ['OK']
    });
  }
}

function showClipboardFiles()
{
  const path = 'file:///' + settings.get('clipboardPath');
  shell.openExternal(path);
}

function showClipboardInfo()
{
  const clipboardFormats = clipboard.availableFormats();

  dialog.showMessageBoxSync({
    type: 'info',
    title: 'Clipboarder',
    message: 'Clipboard info',
    detail: 
      'Clipboard types: ' + JSON.stringify(clipboardFormats) +
      (clipboardFormats.includes('text/plain') ? '\nText size: ' + clipboard.readText().length + ' characters' : ''),
    buttons: ['OK']
  });
}

function loadClipboard()
{
  if (!isClipboardFileAvailable()) {
    dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Clipboarder',
      detail: 'Clipboard files not found',
      buttons: ['OK']
    });
    return;
  }

  // Read clipboard data
  try {
    let clipboardData = {};

    // Clear clipboard
    clipboard.clear();

    // Load clipboard .txt
    if (fs.existsSync(clipboardTXTFile)) {
      console.log('Loading ' + clipboardTXTFile + ' into clipboard');
      clipboardData.text = fs.readFileSync(clipboardTXTFile).toString();
    }

    // Load clipboard .html
    if (fs.existsSync(clipboardHTMLFile)) {
      console.log('Loading ' + clipboardHTMLFile + ' into clipboard');
      clipboardData.html = fs.readFileSync(clipboardHTMLFile).toString();
    }

    // Load clipboard .rtf
    if (fs.existsSync(clipboardRTFFile)) {
      console.log('Loading ' + clipboardRTFFile + ' into clipboard');
      clipboardData.rtf = fs.readFileSync(clipboardRTFFile).toString();
    }

    if (Object.keys(clipboardData).length !== 0) {
      // Write TXT/HMTL/RTF to clipboard
      clipboard.write(clipboardData);
    } else {
      // Write PNG to clipboard
      if (fs.existsSync(clipboardPNGFile)) {
        console.log('Loading ' + clipboardPNGFile + ' into clipboard');
        clipboard.writeImage(clipboardPNGFile, 'PNG');
      }
    }

    // Remove clipboard files
    if (settings.get('removeAfterLoad')) {
      removeClipboardFiles();
    }

    // Update system tray
    systemTray(true);

    if (settings.get('showMessages')) {
      dialog.showMessageBoxSync({
        type: 'info',
        title: 'Clipboarder',
        message: 'Clipboard loaded!',
        detail: settings.get('removeAfterLoad' ? 'Clipboard files removed.' : ''),
        buttons: ['OK']
      });
    }
  } catch(error) {
    // if there was some kind of error, return the passed in defaults instead.
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Clipboarder',
      message: error,
      detail: 'Could not load clipboard',
      buttons: ['OK']
    });
  }
}

function clearClipboard()
{
  // Clear clipboard
  clipboard.clear();

  // Remove clipboard files
  removeClipboardFiles();

  // Update system tray
  systemTray(false);

  // Show success dialogbox
  if (settings.get('showMessages')) {
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Clipboarder',
      message: 'Clipboard cleared!',
      buttons: ['OK']
    });
  }
}

function setClipboardText(text)
{
  // Clear clipboard
  clipboard.clear();

  // Write clipboard text
  clipboard.writeText(text);

  // Update system tray icon
  systemTray(false);
}

function clipboardToPlainText()
{
  console.log('Clipboard to plain text');

  if (clipboard.availableFormats().includes('text/plain')) {
    // Clear clipboard and write text only
    setClipboardText(clipboard.readText());
  }
}

function clipboardToLowerCase()
{
  console.log('Clipboard to lower-case');

  if (clipboard.availableFormats().includes('text/plain')) {
    // Write clipboard text in lower-case
    setClipboardText(clipboard.readText().toLowerCase());
  }
}

function clipboardToUpperCase()
{
  console.log('Clipboard to upper-case');

  if (clipboard.availableFormats().includes('text/plain')) {
    // Write clipboard text in upper-case
    setClipboardText(clipboard.readText().toUpperCase());
  }
}

function clipboardToUnix()
{
  console.log('Clipboard to Unix \\n newlines');

  if (clipboard.availableFormats().includes('text/plain')) {
    // Convert clipboard text to Unix endlines
    let clipboardText = clipboard.readText().replace(/\r\n/g, '\n');

    // Write clipboard text
    setClipboardText(clipboardText);
  }
}

function clipboardToWindows()
{
  console.log('Clipboard to Windows \\r\\n newlines');

  if (clipboard.availableFormats().includes('text/plain')) {
    // Get clipboard text
    let clipboardText = clipboard.readText();

    // Convert clipboard text to Windows endlines
    clipboardText = clipboardText.replace(/\r/g, '');
    clipboardText = clipboardText.replace(/\n/g, '\r\n');

    // Write clipboard text
    setClipboardText(clipboardText);
  }
}

function setClipboardPath()
{
  console.log("Clicked on Set path");

  let clipboardPath = settings.get('clipboardPath');

  if (clipboardPath === '') {
    clipboardPath = '/media';
  }

  var result = dialog.showOpenDialogSync({
    title: 'Clipboard path',
    defaultPath: clipboardPath,
    properties: ['openDirectory']
  });

  if (result && fs.existsSync(result[0])) {
    clipboardPath = result[0];

    settings.set('clipboardPath', clipboardPath);

    systemTray(false);

    console.log('New clipboard path: \'' + clipboardPath + '\'');
  } else {
    console.log('Set clipboard path skipped');
  }
}

function removeAfterLoadToggle()
{
  console.log('Toggle remove clipboard files after load');
  settings.toggle('removeAfterLoad');
}

function loadOnMountToggle()
{
  console.log('Toggle load clipboard on mount');
  settings.toggle('loadOnMount');
}

function showMessagesToggle()
{
  console.log('Toggle show messages');
  settings.toggle('showMessages');
}

function autoLaunchToggle()
{
  console.log('Toggle auto-launch');

  try {
    if (autoLaunchEnabled) {
      autoLauncher.disable();
      autoLaunchEnabled = false;
    } else {
      autoLauncher.enable();
      autoLaunchEnabled = true;
    }

    if (settings.get('showMessages')) {
      dialog.showMessageBoxSync({ 
        type: 'info',
        title: 'Clipboarder',
        message: 'Success',
        detail: 'Auto-launch ' + (autoLaunchEnabled === true ? 'enabled' : 'disabled') + '!'
      });
    }
  } catch(error) {
    dialog.showMessageBoxSync({ 
      type: 'error',
      title: 'Clipboarder',
      message: 'Error',
      detail: 'Could not change auto-launch ' + error
    });
  }
}

function showAbout()
{
  // Get app name from package.json
  var appName = app.getName();

  // First letter uppercase
  appName = appName.charAt(0).toUpperCase() + appName.slice(1);

  // Show about dialogbox
  dialog.showMessageBoxSync({ 
    type: 'info',
    title: 'Clipboarder',
    message: 'About ' + appName,
    detail: 
      'Installed version: ' + app.getVersion() + '\n' +
      'Developer alias: Erriez\n' +
      'Copyright: 2021\n' +
      'License: MIT\n' +
      'Supported platforms: Windows & Linux\n' +
      'Application type: Donationware' +
      (settings.get('donated') ? '' : '\n\nDonated: Not yet...')
  });
}

function showDonationQuestion()
{
  if (!settings.get('donated')) {
    const launchCount = settings.get('launchCount');

    if (launchCount === 10) {
      const answer = dialog.showMessageBoxSync({ 
        type: 'question', 
        title: 'Clipboarder',
        message: 'Thanks for using Clipboarder!',
        detail: 'Would you like to make a small donation to support this project?',
        buttons: ['No', 'Yes']
      });
      if (answer) {
        settings.set('donated', true);
        shell.openExternal(websiteDonation);
        dialog.showMessageBoxSync({ 
          type: 'info',
          title: 'Clipboarder',
          message: 'Clipboarder Donation',
          detail: 'Thank you very much!',
        });
      } else {
        const answer = dialog.showMessageBoxSync({ 
          type: 'info',
          title: 'Clipboarder',
          message: 'Donation skipped',
          detail: 'No problem, you\'ll get one reminder at 100th launch',
        });
      }
    } else if (launchCount === 100) {
      const answer = dialog.showMessageBoxSync({ 
        type: 'question',
        title: 'Clipboarder',
        message: 'Reached 100 Clipboarder launches!',
        detail:
          'It looks like you enjoy Clipboard.\n' +
          'Would you like to make a donation to support this project?',
        buttons: ['No', 'Yes']
      });
      if (answer === 1) {
        settings.set('donated', true);
        shell.openExternal(websiteDonation);
        dialog.showMessageBoxSync({ 
          type: 'info',
          title: 'Clipboarder',
          message: 'Clipboarder Donation',
          detail: 'Thank you very much!',
        });
      } else {
        const answer = dialog.showMessageBoxSync({ 
          type: 'info',
          title: 'Clipboarder',
          message: 'Clipboarder Donation skipped',
          detail: 'No problem, you can make a donation via the Help menu later.',
        });
      }
    }
  }
}

function showFirstLaunchMessage()
{
  // Return when application is launched before
  if (settings.get("firstLaunch")) {
    return;
  }

  // Show usage message at first application startup
  dialog.showMessageBoxSync({ 
    type: 'info',
    title: 'Clipboarder',
    message: 'Welcome to Clipboarder',
    detail: 
      'This clipboard application is designed to transfer clipboard between two computers using a USB stick or cloud storage.\n\n' +
      'In next dialog you\'ll be asked to choose the location of your clipboard storage.'
  });

  // Set clipboard path
  setClipboardPath();

  if (fs.existsSync(settings.get('clipboardPath'))) {
    // Get Unix timestamp
    const now = Math.floor(new Date().getTime() / 1000);

    // Save first launch Unix timestamp
    settings.set("firstLaunch", now);

    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Clipboarder',
      message: 'Success',
      detail: 'Clipboarder is now ready to use via the system tray icon!',
      buttons: ['OK']
    });
  } else {
    dialog.showMessageBoxSync({ 
      type: 'error',
      title: 'Clipboarder',
      message: 'Aborted',
      detail: 
        'Clipboard path not found. Application will now exit.'
    });
    app.exit(1);
  }
}

function systemTray(clipboardSynced)
{
  let menus = [];
  let settingsSubmenu = [];
  let pathTrayIcon;

  // Load settings from configuration file
  loadSettings();

  // Set system tray icon
  if (!fs.existsSync(settings.get('clipboardPath'))) {
    pathTrayIcon = path.join(resourcesPath, 'clipboard-red.png');
  } else {
    if (clipboardSynced) {
      pathTrayIcon = path.join(resourcesPath, 'clipboard-green.png');
    } else {
      pathTrayIcon = path.join(resourcesPath, 'clipboard-yellow.png');
    }
  }

  // Create system tray
  if (tray === null) {
    tray = new Tray(pathTrayIcon);
  } else {
    tray.setImage(pathTrayIcon);
  }

  // Main menu
  if (fs.existsSync(settings.get('clipboardPath'))) {
    if (!isClipboardEmpty()) {
      menus.push(
        { 
          label: 'Save clipboard', 
          type: 'normal',
          click: function () {
            saveClipboard();
          }
        });

      // menus.push(
      //   { 
      //     label: 'Unmount \'' + settings.get('clipboardPath') + '\'',
      //     type: 'normal',
      //     click: function () {
      //       something('unmount ' + settings.get('clipboardPath'));
      //     }
      //   });
    }

    if (isClipboardFileAvailable()) {
      menus.push (
        { 
          label: 'Load clipboard', type: 'normal', click: function () {
            loadClipboard();
          }
        });
    }
  }

  if (!isClipboardEmpty()) {
    menus.push(
      {
        label: 'Clear clipboard', type: 'normal', click: function () {
          clearClipboard();
        }
      });
  } else {
    if (!isClipboardFileAvailable()) {
      menus.push({label: 'Empty clipboard', type: 'normal'});
    }
  }

  // Conversions
  if (!isClipboardEmpty()) {
    menus.push(
      { 
        type: 'separator'
      }, { 
        label: 'Convert case',
        submenu: [
          {
            label: 'to lower',
            click: function () {
              clipboardToLowerCase();
            }
          }, {
            label: 'TO UPPER',
            click: function () {
              clipboardToUpperCase();
            }
          }
        ]
      }, {
        label: 'Convert newlines',
        submenu: [
          {
            label: 'To Unix (LF \\n)',
            click: function () {
              clipboardToUnix();
            }
          }, {
            label: 'To Windows (CRLF \\r\\n)',
            click: function () {
              clipboardToWindows();
            }
          }
        ]
      }, {
        label: 'Convert type',
        submenu: [
          {
            label: 'To plain text',
            click: function () {
              clipboardToPlainText();
            }
          }
        ]
      });
  }
  
  // Clipboard files
  menus.push(
    { 
      type: 'separator'
    }, { 
      label: 'Clipboard files',
      submenu: [
        {
          label: 'Clipboard path: \'' + settings.get('clipboardPath') + '\'',
          click: function () {
            setClipboardPath();
          }
        }, {
          label: 'Show clipboard files', type: 'normal', click: function () {
            showClipboardFiles();
          }
        }, {
          label: 'Show clipboard info', type: 'normal', click: function () {
            showClipboardInfo();
          }
        }
      ]
    });

  // Settings submenu
  if (executablePath && fs.existsSync(executablePath)) {
    // Auto-launch submenu is only availble for compiled .Appimage or .exe with absolute path
    settingsSubmenu.push(
      {
        label: 'Launch at startup',
        type: 'checkbox',
        checked: autoLaunchEnabled,
        click: function () {
          autoLaunchToggle();
        }
      });
  }
      
  settingsSubmenu.push(
    {
      label: 'Load clipboard from files on mount',
      type: 'checkbox',
      checked: settings.get('loadOnMount'),
      click: function () {
        loadOnMountToggle();
      }
    }, {
      label: 'Remove clipboard files after load',
      type: 'checkbox',
      checked: settings.get('removeAfterLoad'),
      click: function () {
        removeAfterLoadToggle();
      }
    }, {
      label: 'Show messages',
      type: 'checkbox',
      checked: settings.get('showMessages'),
      click: function () {
        showMessagesToggle();
      }
    });

  // Settings
  menus.push(
    {
      label: 'Settings',
      submenu: settingsSubmenu
    });
  
  // Help
  menus.push(
    { 
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: function () {
            showAbout();
            shell.openExternal(websiteGithub);
          }
        }, {
          label: 'Check updates',
          click: function () {
            showAbout();
            shell.openExternal(websiteGithubReleases);
          }
        }, {
          label: 'Report bug/issue/feature request',
          click: function () {
            shell.openExternal(websiteGithubIssues);
          }
        }, {
          label: 'Make a donation!',
          click: function () {
            shell.openExternal(websiteDonation);
            settings.set('donated', true);
          }
        }
      ]
    });

  // Exit
  menus.push(
    { 
      type: 'separator'
    },
    { 
      label: 'Exit', type: 'normal', click: function () {
        app.exit(0);
      }
    });

  // Create context menu
  const contextMenu = Menu.buildFromTemplate(menus);

  // Set context menu
  tray.setContextMenu(contextMenu);
}

app.on("ready", () => {
  // Increment launch count
  console.log('Launch count: ' + settings.increment('launchCount'));

  // Initialize clipboard path monitor
  initClipboardFileMonitor();

  // Initialize auto-launcher
  initAutoLauncher();

  // Initialize clipboard monitor
  initClipboardMonitor();
  
  // Show first launch message with usage information
  showFirstLaunchMessage();

  // Ask for donation
  showDonationQuestion();

  // Create system tray icon and menus
  systemTray(false);
});

app.on("window-all-closed", () => {
  app.quit();
});
