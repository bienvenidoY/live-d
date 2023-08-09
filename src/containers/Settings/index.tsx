import classnames from 'classnames'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {useEffect, useMemo, useRef, useState} from 'react'
import Update from '@/components/update'
import EditCode from './components/EditCode'
import { ipcRenderer} from 'electron'

import { Header, Card, Switch, ButtonSelect, Button,Icon, type ButtonSelectOptions, Input, Select } from '@/components'
import { type Lang } from '@/i18n'
import {
    useI18n,
    useVersion,
    identityAtom,
    licenseAtom
} from '@/stores'
import './style.scss'


interface DiskStoreTYpe {
    licenseCode: string
    wsProxyCode: string
    proxyCode: string
}

export default function Settings () {
    const { version } = useVersion()

    const setIdentity = useSetAtom(identityAtom)

    const { translation } = useI18n()
    const { t } = translation('Settings')

    const license = useAtomValue(licenseAtom)
    const [editPopShow,setEditPopShow] = useState(false)

    const [diskStore, setDiskStore] = useState<DiskStoreTYpe>({
        licenseCode: '',
        wsProxyCode: '',
        proxyCode: '',
    })

  const fetchDiskStore = async () => {
    const licenseCode = await ipcRenderer.invoke('license-disk-store-get')
    const wsProxyCode = await ipcRenderer.invoke('wsPort-disk-store-get')
    const proxyCode = await ipcRenderer.invoke('proxy-disk-store-get')
    setDiskStore({
      licenseCode,
      wsProxyCode,
      proxyCode,
    })
  }


  useEffect(() => {
    fetchDiskStore().then()
  }, [])
    return (
        <div className="page">
            <Header title={t('title')} />
            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.externalController')}</span>
                        <div className="flex items-center space-x-2">
                            <span>{diskStore.licenseCode}</span>
                            <span
                              className={classnames({'modify-btn': true}, 'external-controller')}
                              onClick={() => {setEditPopShow(true)}}> 编辑
                            </span>
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.mixedProxyPort')}</span>
                        <div className="flex items-center space-x-2">
                            {license.expireTime}
                        </div>
                    </div>
                </div>
            </Card>
             <Card className="clash-version">
                <span className="check-icon">
                    <Icon type="check" size={20} />
                </span>
                <p className="version-info">当前已是最新版本：{version}</p>
                <span className="check-update-btn">
                  <Update />
                </span>
            </Card>
            <EditCode visible={editPopShow} setEditPopShow={setEditPopShow} fetchDiskStore={fetchDiskStore}/>
        </div>
    )
}
