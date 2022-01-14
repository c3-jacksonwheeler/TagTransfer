const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");
const path = require("path");
const fs = require("fs");

let win;


const axios = require('axios');

const { TagTransfer } = require('./TagTransfer.js')
const { TagValidator } = require('./TagValidator.js')

const { TransferState } = require('./TransferState.js')


function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // is default value after Electron v5
      contextIsolation: false, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js") // use a preload script
    }
  })

  win.loadFile('../statics/index.html')
  win.once('ready-to-show', () => {
    win.show();
    win.webContents.openDevTools();

  });
  win.on('show', () => {
    setTimeout(() => {
      win.focus();
    }, 200);
  });

}

const testDataFileInit = `
let testData = {
  fromConfig: {
    host:"https://<your environment>.c3.ai/",
    tenant:"<tenant>",
    tag:"<tag>",
    token:"<c3Auth Token>",
  },
  toConfig: {
    host:"localhost:8080",
    tenant:"<tenant>",
    tag:"<tag>",
    token:"<c3Auth Token>",
  }
}
module.exports = {testData}
`


let start = () => {
  TransferState.setup(ipcMain);

  app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })


}

// To avoid checking this into the repo, generate this file dynamically.
// This is a convenience feature, just put credentials and config into testData.js to avoid having to re-enter a bunch
fs.exists("testData.js", function (exists) {
  if (exists) {
    start();
  }
  else {
    fs.writeFile("testData.js", testDataFileInit, { flag: 'wx' }, function (err, data) {
      start();
    })
  }
});


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


ipcMain.on('validateTagAccess', TagValidator.validateTag)


// Don't use from the UI, requests should go through TransferState unless testing
ipcMain.on('beginTransfer', TagTransfer.beginTransfer)