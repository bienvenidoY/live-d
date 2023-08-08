import { app, ipcMain} from 'electron'
// 判断本地证书是否存在，然后再安装
// cert.crt 和cert.key

import { access, constants } from 'node:fs/promises'
import util from 'node:util'
const exec = util.promisify(require('node:child_process').exec);
import path from 'path'


//当前应用的目录
const appPath = app.isPackaged ? process.resourcesPath : app.getPath('userData')

// 判断是否存在证书
const readCertIsExists = async () => {
  try {
    const rootPath = path.resolve(appPath, '..')
    await access(`${rootPath}/mitmproxy-ca.p12`, constants.F_OK)
  } catch (e){
    console.log(e)
    return false;
  }
  return true;
}


type AppNameType = 'install' | 'proxy' | 'main'

const runExec = async (appName: AppNameType, params: string = '') => {
  try {
    return await exec(`${appPath}/${appName}.exe ${params}`)
  }catch (e) {
    console.log(e)
    return Promise.reject(e)
  }
}

export const injectExecScript = () => {
  ipcMain.handle('logs', async (event,key, params) => {
    return {
      getPathUserData: app.getPath('userData'),
      getPathExe: app.getPath('exe'),
      getAppPathUserData: app.getAppPath(),
      appPath: appPath,
      resourcesPath: process.resourcesPath,
    }
  });
  ipcMain.handle('run-exec', async (event,key, params) => {
    return runExec(key, params)
  });

  ipcMain.handle('read-cert-is-exist', async () => {
    return await readCertIsExists()
  });

}
