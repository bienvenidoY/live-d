import Store from 'electron-store'
import yaml from 'js-yaml'
import {app, ipcMain} from "electron";

export const licenseDiskStore = new Store({
  name: 'License',
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load as any,
})
const DefaultWSPort = '2333'
const DefaultProxyPort = '3030'


// save license
const saveLicense = (value: string) => licenseDiskStore.set('license', value)
// get license
const getLicense = () => licenseDiskStore.get('license')

// save ws_port
const saveWSPort = (value?: string) => {
  licenseDiskStore.set('ws_port', value || DefaultWSPort)
}
// get ws_port
const getWSPort = () => licenseDiskStore.get('ws_port')

// save proxy_port
const saveProxyPort = (value?: string) => {
  licenseDiskStore.set('proxy_port', value || DefaultProxyPort)
}
// get proxy_port
const getProxyPort = () => licenseDiskStore.get('proxy_port')



export const injectDiskStore = () => {
  ipcMain.handle('license-disk-store', (event, key) => {
    console.log(app.getPath('userData'), getLicense())
    return saveLicense(key)
  });
  ipcMain.handle('license-disk-store-get', () => {
    console.log(app.getPath('userData'), getLicense())
    return getLicense()
  });
  ipcMain.handle('wsPort-disk-store', (event, key) => {
    return saveWSPort(key)
  });
  ipcMain.handle('wsPort-disk-store-get', () => {
    console.log(app.getPath('userData'), getWSPort())
    return getWSPort()
  });

  ipcMain.handle('proxy-disk-store', (event, key) => {
    return saveProxyPort(key)
  });
  ipcMain.handle('proxy-disk-store-get', () => {
    console.log(app.getPath('userData'), getWSPort())
    return getProxyPort()
  });
}
