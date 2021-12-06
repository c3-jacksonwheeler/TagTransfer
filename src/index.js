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
/*



*/


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





// ipcMain.on("requestData", (event, data)=>{

//   console.log(data);


//   axios.post(data.url, 
//     {},
//     {
//             headers: {
//                 Cookie: `c3auth=30330a4d508be7e1748acbb0b0fabbebfcd94853635951157cf2a0e19f183eef1811; c3tenant=nypa; c3tag=prod`
//     }
//   }).catch((err) => {console.err(err)}).then(response => {

//     event.reply('displayMessage',response.data)


//   }).catch(err => console.log);



// })


ipcMain.on('validateTagAccess', TagValidator.validateTag)


// ipcMain.on('validateTagAccess', (event, data)=>{


// })




ipcMain.on('beginTransfer', TagTransfer.beginTransfer)








