import React, {useState, forwardRef, useEffect} from "react";
import {Modal} from '@arco-design/web-react';
import './style.scss'
import {Alert, Input, warning} from "@/components";
import {useObject} from "@/lib/hook";
import {ipcRenderer} from "electron";
import {licenseAtom, secretStorageAtom, useServiceClient} from "@/stores";
import {useAtom} from "jotai";


interface EditCodeProps {
    visible: boolean
    setEditPopShow: (val: boolean) => void
    fetchDiskStore:()=>void
}

const EditCode: React.FC = forwardRef((props: EditCodeProps, ref) => {

    const client = useServiceClient()
    const [errText, setErr] = useState('')
    const [value, set] = useObject({
        licenseCode: '',
    })
    const [defaultSecret, setSecret] = useAtom(secretStorageAtom)
    const [license, setLicense] = useAtom(licenseAtom)

    async function handleOk() {
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
        } catch (e) {
            console.log(e.message)
            setErr(e.message)
        }

    }

    async function getLicense(licenseCode) {
        try {
            const resp = await client.getActiveCodeTime(licenseCode as string)
            console.log(resp,123123123)
            errText && setErr('')
            const isExpired = license.expireTime && +new Date(license.expireTime) < +new Date().getTime()
            if (isExpired) {
                setErr('序列号已过期')
            }
            props.setEditPopShow(!!isExpired)
            setLicense(resp.data ?? {})
            props.fetchDiskStore()
        } catch (e) {
            setErr(e.message)
        }
    }

    useEffect(()=>{
        if(!props.visible){
            set('licenseCode', '')
            setErr('')
        }
    },[props.visible])

    return (
        <Modal
            title='授权码'
            visible={props.visible}
            onOk={() => handleOk()}
            onCancel={() => props.setEditPopShow(false)}
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
    )
})

export default EditCode
