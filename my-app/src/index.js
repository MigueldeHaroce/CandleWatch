const { app, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { BrowserWindow } = require('electron-acrylic-window');
const sound = require("sound-play");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 455,
    height: 370,// Enable transparent background
    minHeight: 110,
    minWidth: 170,
    frame: false, 
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      experimentalFeatures: true
    },
    vibrancy: {
      theme: '#11192826', // (default) or 'dark' or '#rrggbbaa'
      effect: 'acrylic', // (default) or 'blur'
      disableOnBlur: true, // (default)
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'selectTime.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Register an empty function as the handler for the Ctrl+Shift+I shortcut
  globalShortcut.register('CommandOrControl+Shift+I', () => {})
})

app.on('will-quit', () => {
  // Unregister the custom handler when the app is quitting
  globalShortcut.unregisterAll()
})

ipcMain.on('start-timer', (event, duration) => {
  let endTime = new Date().getTime() + duration * 60 * 1000;

  BrowserWindow.getFocusedWindow().loadURL(`file://${__dirname}/index.html?duration=${duration}`);
  BrowserWindow.getFocusedWindow().setResizable(true);

  event.sender.send('durationSelected', duration);

  const updateTimer = () => {
    const currentTime = new Date().getTime();
    const remainingTime = endTime - currentTime;
    
    console.log(remainingTime);

    if (remainingTime > 0) {
      let focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          focusedWindow = windows[0];
        }
      }
  
      if (focusedWindow) {
        focusedWindow.webContents.send('update-timer', remainingTime);
      }

      if (remainingTime <= 5000 && remainingTime >= 4500) {
        console.log('sound played');
        const filePath = path.join(__dirname, "sound.mp3");
        sound.play(filePath);
      }
    } else {
      console.log('Timer has reached 0');
  
      // Timer has reached 0, start over with a new duration
      const newEndTime = new Date().getTime() + duration * 60 * 1000;
  
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].loadURL(`file://${__dirname}/index.html?duration=${duration}`);
      }
  
      event.sender.send('durationSelected', duration);
  
      // Start the timer again with the new duration
      endTime = newEndTime;
    }
  
    setTimeout(updateTimer, 500); // Update the timer every second
  };
  
  updateTimer();
  
});
