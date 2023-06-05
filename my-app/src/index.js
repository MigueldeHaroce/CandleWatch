const { app, ipcMain } = require('electron');
const path = require('path');
const { BrowserWindow } = require('electron-acrylic-window');
const sound = require("sound-play");
const { Menu, MenuItem } = require('electron')

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 455,
    height: 370,// Enable transparent background
    frame: false, 
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

  const menu = new Menu()
  menu.append(new MenuItem({
    label: 'New Menu Item',
    click: () => {
      console.log('New Menu Item clicked')
    }
  }))
  menu.append(new MenuItem({
    label: 'Minimize',
    click: () => {
      mainWindow.minimize()
    }
  }))
  menu.append(new MenuItem({
    label: 'Close',
    click: () => {
      mainWindow.close()
    }
  }))

  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault()
    menu.popup({ window: mainWindow })
  })

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

ipcMain.on('start-timer', (event, duration) => {
  let endTime = new Date().getTime() + duration * 60 * 1000;

  BrowserWindow.getFocusedWindow().loadURL(`file://${__dirname}/index.html?duration=${duration}`);

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

      if (remainingTime <= 4500 && remainingTime >= 4000) {
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
