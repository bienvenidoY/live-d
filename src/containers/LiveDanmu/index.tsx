import {useEffect, useState, forwardRef} from 'react'
import './style.scss'

import {
    Input,
    Space,
    Button,
    Grid,
    Table,
    Typography,
    Image,
    Checkbox,
    Card,
    Notification,
    Drawer,
    Select,
} from '@arco-design/web-react';
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn') // use local

dayjs.extend(utc);
const CheckboxGroup = Checkbox.Group;
const useCheckbox = Checkbox.useCheckbox;


const Row = Grid.Row;
const Col = Grid.Col;
import React from 'react'
import {validURL} from "@/lib/validate";
import * as XLSX from 'xlsx'
import {ResizeAbel} from './components/resizable'
import {ResizeAbel as ResizeAbelUser} from './components/resizable_user'
import {useServiceClient} from "@/stores";
import {StreamReader} from "@/lib/streamer";
import Long from 'long';
import {ipcRenderer} from "electron";

export enum LiveStatsType {
    '正在直播' = 2,
    '未开播' = 4
}

export enum ConnectEnum {
    '未抓取' = 0,
    '正在抓取' = 1
}

const columns = [
    {
        title: '序号',
        width: 60,
        render: (col, item: T, index: number) => index + 1
    },
    {
        title: '房间标题',
        dataIndex: 'roomTitle',
        width: 140,
        render: (col, item) => {
            return <Typography.Paragraph ellipsis={{
                rows: 1, showTooltip: true,
                wrapper: 'span',
            }} style={{marginBottom: 0}}>
                {item.roomTitle ?? '--'}
            </Typography.Paragraph>
        }
    },
    {
        title: '主播昵称',
        dataIndex: 'nickname',
        width: 100,
        render: (col, item) => {
            return <Typography.Paragraph
                ellipsis={{
                    rows: 1, showTooltip: true,
                    wrapper: 'span',
                }} style={{marginBottom: 0}}
            >
                {item.owner?.nickname ?? '--'}
            </Typography.Paragraph>
        }
    },
    {
        title: '开播状态',
        dataIndex: 'roomStatus',
        render: (col, item) => {
            return <>
                {/* 2开播 4关播 */}
                {LiveStatsType['正在直播'] === item.roomStatus ? LiveStatsType[LiveStatsType['正在直播']] : LiveStatsType[LiveStatsType['未开播']]}
            </>
        }
    },
    {
        title: '在线/观看',
        dataIndex: 'total',
        render: (col, item) => {
            return <>
                {item.userCountStr}/ {item.totalUserStr}
            </>
        }
    },
    {
        title: '喜欢',
        dataIndex: 'likeCountStr',
    },
    {
        title: '抓取状态',
        dataIndex: 'email3',
        render: (col, item) => {
            return <>
                {ConnectEnum['正在抓取'] === item.connectStatus ? ConnectEnum[ConnectEnum['正在抓取']] : ConnectEnum[ConnectEnum['未抓取']]}
            </>
        }
    },
];

interface SearchHeaderProps {
    onAddLive: (liveUrlList: string[]) => void
    setTableValues: (list: any[]) => void
    clearAllLive: () => void
    setLiveRoomList: (val: any) => void
    setUserData: (val: any) => void
    liveRoomList: []
    startAll: () => void
    stopAll: () => void
}

const SearchHeader: React.FC = (props: SearchHeaderProps) => {

    const [liveUrl, setLiveUrl] = useState('')

    function addLive() {
        if (!liveUrl) {
            Notification.warning({
                content: '请输入链接',
            })
            return;
        }
        if (!validURL(liveUrl)) {
            Notification.error({
                content: '请输入正确链接',
            })
            return
        }
        // TODO 添加直播间
        props.onAddLive([liveUrl])
    }

    async function clearAll() {
        // 清空输入框
        liveUrl && setLiveUrl('')

        props.clearAllLive()
    }

    function handleUploadFile() {
        // 获取导入的内容
        return new Promise((resolve, reject) => {
            // 解析Excel
            function changeFile(e) {
                const file = e.target.files[0]
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onloadend = (progressEvent) => {
                    const arrayBuffer = reader.result;
                    const options = {type: 'array'};
                    const workbook = XLSX.read(arrayBuffer, options);
                    const reslut = []
                    workbook.SheetNames.forEach(item => {
                        const tv = XLSX.utils.sheet_to_json(workbook.Sheets[item])
                        if (tv.length < 200) {
                            reslut.push({
                                name: item,
                                tableValue: tv
                            })
                        } else {
                            Notification.error({
                                title: 'Error',
                                content: '最多不能超过200条',
                            })
                        }
                    })
                    resolve(reslut)
                }
                document.body.removeChild(input)
            }

            const input = document.createElement('input')
            input.type = 'file'
            input.onchange = (e) => changeFile(e)
            // input.accept = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            document.body.append(input)
            input.click()
        })
    }

    // 判断字符串是不是url
    const isValidUrl = urlString => {
        let url;
        try {
            url = new URL(urlString);
        } catch (e) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }

    function uploadExcelFile() {
        // TODO 上传excel 解析到直播列表中
        const errList = [] // 不符合要求的数据
        const successList = [] //符合要求的数据
        handleUploadFile().then(res => {
            res.forEach(d => {
                d.tableValue.forEach((s, index) => {
                    if (isValidUrl(s[Object.keys(s)[0]])) {
                        successList.push(s)
                    } else {
                        errList.push({
                            idx: index, val: s
                        })
                    }
                })
            })
            props.setTableValues([successList, errList])
            props.onAddLive(successList.map(item => item[Object.keys(item)[0]]))
            console.log(errList, successList, 123123123)
        })
    }

    function saveExcelFile() {
        // TODO 导出所有直播列表中ws
    }

    return (<div style={{marginBottom: 16}}>
        <Space size='small'>
            <Input style={{width: 400}} placeholder={'输入直播链接'}
                   value={liveUrl}
                   onChange={(value) => {
                       setLiveUrl(value)
                   }}
                   allowClear
            />
            <Button type='secondary' onClick={clearAll}>
                清空所有
            </Button>
            <Button type='secondary' onClick={addLive}>
                添加
            </Button>
            <Button type='secondary' onClick={uploadExcelFile}>
                导入
            </Button>
            <Button type='secondary' onClick={props.startAll}>
                全部开始
            </Button>
            <Button type='secondary' onClick={props.stopAll}>
                全部结束
            </Button>
            <Button type='secondary' onClick={saveExcelFile}>
                保存Excel
            </Button>
            {/* <Button  type='secondary'>
        软件设置
      </Button>*/}
        </Space>
    </div>)
}


interface LiveRoomTableProps {
    liveRoomList: typeof columns[]
    setLiveRoomList: (val: any) => void
    startConnect: (val: any) => void
    stopConnect: (val: any) => void
    removeLive: (val: any) => void
    exportLive: () => void
    clearAllLive: () => void
    shareQrCodeData: { url: string, nickname: string }
}

const LiveRoomTable: React.FC = (props: LiveRoomTableProps) => {
    function openRightMenu(menuItem, record, index) {
        /*
        *   {type: 'start', text: '抓取',},
        {type: 'stop', text: '停止',},
        {type: 'openLive', text: '打开直播间',},https://live.douyin.com/229175459221
        {type: 'remove', text: '删除直播间',},
        {type: 'export', text: '导出所有直播间',},
        {type: 'clearAll', text: '清空',},
        * */
        if(menuItem.type === 'start') {
            props.startConnect(record, index)
        }else if(menuItem.type === 'stop'){
            props.stopConnect(record, index)
        }else if(menuItem.type === 'remove'){
            props.removeLive(record, index)
        }else if(menuItem.type === 'export'){
            props.exportLive()
        }else if(menuItem.type === 'clearAll'){
            props.clearAllLive()
        }
    }

    return (
        <Row>
            <Col span={16}>
                <div>
                    <ResizeAbel
                        columns={columns}
                        data={props.liveRoomList}
                        openRightMenu={openRightMenu}
                    />
                </div>
            </Col>
            <Col span={8}>
                <Space direction='vertical' style={{margin: '0 24px'}}>
                    <Typography.Text bold>二维码-【用户昵称：{props.shareQrCodeData.nickname}】</Typography.Text>

                    <Image
                        width={250}
                        height={250}
                        src={props.shareQrCodeData.url || 'some-error.png'}
                        alt='未选择用户'
                    />
                </Space>
            </Col>
        </Row>
    )
}


const options = [
    {label: '进入', value: 1, defaultChecked: false},
    {label: '礼物', value: 2, defaultChecked: true},
    {label: '弹幕', value: 3, defaultChecked: true},
    {label: '点赞', value: 4, defaultChecked: true},
    {label: '关注', value: 5, defaultChecked: true},
    {label: '信息跟随', value: 6, defaultChecked: true},
    {label: '自动去重', value: 7, defaultChecked: true},
    {label: '自动抓取', value: 8, defaultChecked: true},
    {label: '解析完整信息(需要代理,采集速度会变慢)', value: 9, defaultChecked: false},
]

interface UserTableOptionsProps {
    livePendingOptions: []
}

const UserTableOptions: React.FC = (props: UserTableOptionsProps) => {
    const {
        selected,
        setSelected,
        isPartialSelected,
        toggle,
    } = useCheckbox(
        options.map((x) => x.value),
        options.map((x) => x.defaultChecked && x.value)
    );

    const onChange = (v) => {
        console.log(v)
        setSelected(v)
    }


    return (
        <div>
            <Space>
                <Select
                    addBefore='直播间'
                    placeholder='请选择直播间'
                    showSearch
                    style={{width: 300}}
                    onChange={(value) =>
                        console.log(123)
                    }
                >
                    {props.livePendingOptions.map((option, index) => (
                        <Option key={option} value={option}>
                            {option.roomTitle}
                        </Option>
                    ))}
                </Select>
                <Button>保存Excel</Button>
                <CheckboxGroup value={selected} options={options} onChange={onChange}/>
            </Space>
        </div>
    );
}

enum MessageMethodEnums {
    "WebcastGiftMessage" = '礼物:',
}


const userColumns = [
    {
        title: '序号',
        width: 60,
        render: (col, item: T, index: number) => index + 1
    },
    {
        title: '主播昵称',
        dataIndex: 'name',
        width: 140,
        render: (col, item) => {
            const {toUser} = item
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {toUser?.nickName}
            </Typography.Paragraph>
        }
    },
    {
        title: '动作',
        dataIndex: 'salary',
        width: 100,
        render: (col, item) => {
            const {common: {method, describe}} = item
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {MessageMethodEnums[method]}{describe}
            </Typography.Paragraph>
        }
    },
    {
        title: '礼物数量',
        dataIndex: 'address',
        render: (col, item) => {
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {item?.gift?.diamondCount}
            </Typography.Paragraph>
        }
    },
    {
        title: '动作时间',
        width: 140,
        dataIndex: '动作时间',
        render: (col, item) => {
            const data = item.common.createTime
            const transValue = Long.fromBits(data.low, data.high, data.unsigned)
            const value = transValue.toString().length === 10 ? transValue.toString() + '000' : transValue.toString()
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {dayjs.utc(+value).format('YYYY/MM/DD HH:mm:ss')}
            </Typography.Paragraph>
        }
    },
    {
        title: 'Uid',
        dataIndex: 'email1',
        render: (col, item) => {
            const data = item.user.id

            const value = Long.fromBits(data.low, data.high, data.unsigned)
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {value.toString()}
            </Typography.Paragraph>
        }
    },
    {
        title: 'Secuid',
        dataIndex: 'email2',
        render: (col, item) => {
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {item.user.secUid}
            </Typography.Paragraph>
        }
    },
    {
        title: '用户昵称',
        dataIndex: 'email3',
        render: (col, item) => {
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {item.user.nickName}
            </Typography.Paragraph>
        }
    },
    {
        title: '抖音号',
        dataIndex: 'email4',
        render: (col, item) => {
            return <Typography.Paragraph ellipsis={{rows: 1, showTooltip: true, wrapper: 'span'}}>
                {item.user.displayId}
            </Typography.Paragraph>
        }
    },
    {
        title: '性别',
        dataIndex: 'email5',
    },
    {
        title: '年龄',
        dataIndex: 'email6',
    },
    {
        title: '城市',
        dataIndex: 'email7',
    },
    {
        title: '简介',
        dataIndex: 'email8',
    },
    {
        title: '私密账号',
        dataIndex: 'email9',
    },
    {
        title: '手机号',
        dataIndex: 'email10',
    },
];

type ShareQrCodeDataType = {
    url: string
    nickname: string
}
interface UserTableProps {
    userData: [],
    setShareQrCodeData: (val: (prev: ShareQrCodeDataType) => ShareQrCodeDataType) => void
}

const UserTable: React.FC = (props: UserTableProps) => {
    const client = useServiceClient()

    const onUserClick = (item) => {
        console.log(item)
        client.getUserprofile(item.user.secUid).then(res => {
            const share_qrcode_url = res?.data?.share_info?.share_qrcode_url ?? {}
            const {url_list = []} = share_qrcode_url
            props.setShareQrCodeData(() => ({
                url: url_list[0] ?? '',
                nickname: item.user.nickName ?? ''
            }))
        }).catch(() => {

        })
    }
    return <div>
        <ResizeAbelUser
            columns={userColumns}
            data={props.userData}
            onUserClick={onUserClick}
        />
    </div>
}

interface ErrorDrawerProps {
    drawerShow: boolean
    setDrawerShow: (val: boolean) => void
    tableValues: any[]
}

const ErrorDrawer: React.FC = (props: ErrorDrawerProps) => {
    return <div>
        <Drawer
            width={332}
            title={<span>错误数据</span>}
            visible={props.drawerShow}
            onOk={() => {
                props.setDrawerShow(false);
            }}
            onCancel={() => {
                props.setDrawerShow(false);
            }}
        >
            {
                props.tableValues[1] ? props.tableValues[1].map((item, index) => {
                    return (
                        <div key={index}>
                            {`第${index + 1}行数据有误`}
                        </div>
                    )
                }) : null
            }
        </Drawer>
    </div>
}


const LiveDanmuPage = () => {
    const [liveRoomList, setLiveRoomList] = useState([])
    const [drawerShow, setDrawerShow] = useState(false)
    const [tableValues, setTableValues] = useState([])
    const [livePendingOptions, setLivePendingOptions] = useState([])
    const client = useServiceClient()
    const [userData, setUserData] = useState([])
    const [shareQrCodeData, setShareQrCodeData] = useState({url: '', nickname: ''})


    useEffect(() => {
        if (tableValues.length > 0) {
            setDrawerShow(true)
        }
    }, [tableValues])


    function addLive(liveUrlList: string[]) {
        // 剔除相同直播间
        const list = liveUrlList.filter(value => !liveRoomList.some(obj => obj.roomUrl === value));

        if (!list.length) {
            Notification.warning({
                content: '已添加过直播间',
            })
            return
        }
        client.getRoomInfo(list).then(res => {
            const {roomInfo} = res.data
            if (Array.isArray(roomInfo)) {
                setLiveRoomList([
                    ...liveRoomList,
                    ...roomInfo.map(v => {
                        v.connectStatus = ConnectEnum['未抓取']
                        return v
                    })
                ])
            }else {
                Notification.warning({
                    content: '直播间已关闭',
                })
            }
        })
    }

    async function clearAllLive() {
        // 断开所有直播状态
        await stopAll()
        // 清空直播列表
        setLiveRoomList([])
        // 清空用户评论列表
        setUserData([])
        // 清空二维码信息
        setShareQrCodeData({url: '', nickname: ''})
    }

    async function startAll() {
        const list = liveRoomList.filter(obj => obj.connectStatus === ConnectEnum['未抓取'])
        if(!liveRoomList.length) {
            Notification.warning({
                content: '还未导入直播间',
            })
            return
        }
        if(!list.length) {
            Notification.warning({
                content: '列表中直播间已全部开始',
            })
            return
        }
        for (const record of list) {
            await startConnect(record);
        }
    }
    async function stopAll() {
        const list = liveRoomList.filter(obj => obj.connectStatus === ConnectEnum['正在抓取'])
        if(!list.length) {
            Notification.warning({
                content: '没有可以终止的直播间',
            })
            return
        }
        for (const record of list) {
            await stopConnect(record);
        }
    }
    async function startConnect(record, index?: number) {
        const list = [...liveRoomList]
        const recordIndex = index ?? list.findIndex(v => v.roomUrl === record.roomUrl)
        console.log(recordIndex)
        if(recordIndex> -1) {
            list[recordIndex].connectStatus = ConnectEnum['正在抓取']
        }

        const handleMessage = (event, data) => {
            setUserData((prevUserData) => {
                return [...prevUserData, ...data];
            })
        }

        await ipcRenderer.invoke('createSocket', {...record.wsData, liveId: record.id})
        await ipcRenderer.invoke('subscribe', 'data')
        ipcRenderer.on('data-response', handleMessage);
        setLiveRoomList(list)
    }
    async function stopConnect(record, index?) {
        const list = [...liveRoomList]
        const recordIndex = index ?? list.findIndex(v => v.roomUrl === record.roomUrl)
        if(recordIndex> -1) {
            list[recordIndex].connectStatus = ConnectEnum['未抓取']
        }

        await ipcRenderer.invoke('closeSocket', record.id)
        setLiveRoomList(list)
    }
    function exportLive() {

    }
    async function removeLive(record, index) {
        // 如果开播时关闭
        if (record.connectStatus === ConnectEnum['正在抓取']) {
            // 断开ws
            await stopConnect(record, index)
        }
        const list = [...liveRoomList]
        list.splice(index, 1)
        setLiveRoomList(list)
    }

    return <div className="page">
        <Space size={16} direction="vertical" style={{width: '100%'}}>
            <Card>
                <SearchHeader onAddLive={addLive}
                              setTableValues={setTableValues}
                              clearAllLive={clearAllLive}
                              liveRoomList={liveRoomList}
                              setLiveRoomList={setLiveRoomList}
                              startAll={startAll}
                              stopAll={stopAll}
                              setUserData={setUserData}
                />
                <LiveRoomTable liveRoomList={liveRoomList}
                               startConnect={startConnect}
                               stopConnect={stopConnect}
                               exportLive={exportLive}
                               removeLive={removeLive}
                               clearAllLive={clearAllLive}
                               setLiveRoomList={setLiveRoomList}
                               shareQrCodeData={shareQrCodeData}
                />
            </Card>
            <Row>
                <Col span={24}>
                    <Card>
                        <Space size={8} direction="vertical" style={{width: '100%'}}>
                            <UserTableOptions livePendingOptions={livePendingOptions}/>
                            <UserTable userData={userData} setShareQrCodeData={setShareQrCodeData}/>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </Space>
        <ErrorDrawer drawerShow={drawerShow} setDrawerShow={setDrawerShow} tableValues={tableValues}/>
    </div>
}

export default LiveDanmuPage
