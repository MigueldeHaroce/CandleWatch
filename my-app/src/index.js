const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 370,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
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

ipcMain.on('start-timer', (event, duration) => {
  const endTime = new Date().getTime() + duration * 60 * 1000;

  BrowserWindow.getFocusedWindow().loadURL(`file://${__dirname}/index.html?duration=${duration}`);

  event.sender.send('durationSelected', duration);

  const updateTimer = () => {
    const currentTime = new Date().getTime();
    const remainingTime = endTime - currentTime;

    console.log(remainingTime);

    if (remainingTime > 0) {
      BrowserWindow.getFocusedWindow().webContents.send('update-timer', remainingTime);
      setTimeout(updateTimer, 1000); // Update the timer every second
    } else {
      BrowserWindow.getFocusedWindow().webContents.send('timer-complete');
    }
  };
  updateTimer();

});
