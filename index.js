const {
  app,
  BrowserWindow,
  ipcMain
} = require("electron");
const path = require("path");
const fs = require("fs");

let win;


function createWindow () {
	win = new BrowserWindow({
	    width: 800,
	    height: 600,
	    webPreferences: {
			nodeIntegration: false, // is default value after Electron v5
			contextIsolation: true, // protect against prototype pollution
			enableRemoteModule: false, // turn off remote
			preload: path.join(__dirname, "preload.js") // use a preload script
	    }
  	})

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0){
    	createWindow()
    }
  })
})


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'){
  	app.quit()
  }
})


ipcMain.on("toMain", (event, args) => {
  
  win.webContents.send("fromMain", {"foo":"bar"});
});

