import {useRoomStreamReader} from '@/stores'

import './style.scss'

export default function ProxyContainer () {
    const roomStreamReader =  useRoomStreamReader()

    const handleLogs = (aaa: any) => {
        console.log('aaa', aaa)
    }

    const connect = () => {
        const data = {
            url: "https://live.douyin.com/447123525000",
            secret:"SN24ffb0196aa7clec81386461d6f2df52"
        }
        roomStreamReader.send(data)
        roomStreamReader.subscribe('data', handleLogs)
    }

    const closeConnect = () => {
        roomStreamReader.close()
    }
    return (
        <div className="page">
            <button onClick={connect}>连接</button>
            <button onClick={closeConnect}>断开</button>
        </div>
    )
}
