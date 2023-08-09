import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'
import useSWR from 'swr'

import {Modal, Input, Alert, warning, Loading} from '@/components'
import { useObject } from '@/lib/hook'
import { secretStorageAtom, useServiceClient, licenseAtom} from '@/stores'
import './style.scss'

export default function ExternalController () {
    const client = useServiceClient()
    const [identityIsShow, setIdentityIsShow] = useState(false)
    const [license, setLicense] = useAtom(licenseAtom)
    const [value, set] = useObject({
        licenseCode: '',
    })
    const [defaultSecret, setSecret] = useAtom(secretStorageAtom)


    const [isLoading, setLoading] = useState(false)
    const [errText, setErr] = useState('')

    useSWR('getLicenseCode', async () => {
        const licenseCode = await ipcRenderer.invoke('license-disk-store-get')
        if(!licenseCode) {
            setLoading(false)
            setIdentityIsShow(true)
            return
        }
        setSecret(licenseCode)
        await getLicense(licenseCode)
    })

    async function handleOk () {
        const {licenseCode} = value

        if (!licenseCode) {
            warning('请输入授权码')
            return
        }
        try {
            await client.getActiveSecret(licenseCode)
            await ipcRenderer.invoke('license-disk-store', licenseCode)
            await ipcRenderer.invoke('wsPort-disk-store')
            await ipcRenderer.invoke('proxy-disk-store')
            setSecret(licenseCode)
            await getLicense(licenseCode)
        }catch (e) {
            console.log(e.message)
            setErr(e.message)
        }

    }

    async function getLicense(licenseCode) {
        try {
            const resp = await client.getActiveCodeTime(licenseCode as string)
            // 过期打开弹窗，否则关闭弹窗
            setLoading(false)
            errText && setErr('')
            const isExpired = license.expireTime && +new Date(license.expireTime) < +new Date().getTime()
            if(isExpired) {
                setErr('序列号已过期')
            }
            setIdentityIsShow(!!isExpired)
            setLicense(resp.data ?? {})
        }catch (e) {
            setErr(e.message)
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
    }, [])
    return (
        <>
            <Loading visible={isLoading} />
            <Modal
              className="!w-105 !<sm:w-84"
              show={identityIsShow}
              title='授权码'
              maskClosable={false}
              bodyClassName="external-controller"
              isShowCancelBtn={false}
              onOk={handleOk}
            >
                {
                    errText ? <Alert type="error" inside={true}>
                          <p>{errText}</p>
                      </Alert> :
                    <Alert type="info" inside={true}>
                        <p>正确填写授权码，否则会导致无法激活</p>
                    </Alert>
                }
                <div className="flex items-center">
                    <div className="my-1 w-14 font-bold md:my-3">序列号</div>
                    <Input
                      className="my-1 w-14 flex-1 md:my-3"
                      align="left"
                      inside={true}
                      value={value.licenseCode}
                      onChange={licenseCode => set('licenseCode', licenseCode)}
                      onEnter={handleOk}
                    />
                </div>
            </Modal>
        </>
    )
}
