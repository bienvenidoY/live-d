import EventEmitter from 'eventemitter3'
import { io } from "socket.io-client";

import { type SetRequired } from 'type-fest'

export interface Config {
    bufferLength?: number
    retryInterval?: number
}

export interface SocketData {
    url: string
    secret: string
}

export class StreamReader<T> {
    protected EE = new EventEmitter()

    protected config: SetRequired<Config, 'bufferLength' | 'retryInterval'>

    protected innerBuffer: T[] = []

    protected url = ''
    protected cookie = ''
    protected userAgent = ''

    protected connection: WebSocket | null = null

    constructor (config: Config) {
        this.config = Object.assign(
            {
                bufferLength: 0,
                retryInterval: 5000,
            },
            config,
        )
    }

    protected connectWebsocket () {
        if (!this.url) {
            return
        }

        const url = new URL(this.url)

        this.connection = new WebSocket(url.toString())

        this.connection.addEventListener('message', msg => {
            const data = JSON.parse(msg.data)
            this.EE.emit('data', [data])
            if (this.config.bufferLength > 0) {
                this.innerBuffer.push(data)
                if (this.innerBuffer.length > this.config.bufferLength) {
                    this.innerBuffer.splice(0, this.innerBuffer.length - this.config.bufferLength)
                }
            }
        })

        this.connection.addEventListener('error', err => {
            this.EE.emit('error', err)
            this.connection?.close()
            setTimeout(this.connectWebsocket, this.config.retryInterval)
        })
    }

    connect (wsData) {
        const { wsUrl, wsCookie, wsUserAgent } = wsData
        if (this.url === wsUrl && this.connection) {
            return
        }
        this.url = wsUrl
        this.cookie = wsCookie
        this.userAgent = wsUserAgent
        this.connection?.close()
        this.connectWebsocket()
    }
    send (data: SocketData) {
        const sendData: string = JSON.stringify(data)
        this.connection?.send(sendData)
    }
    close () {
        this.connection?.close()
    }

    subscribe (event: string, callback: (data: T[]) => void) {
        this.EE.addListener(event, callback)
    }

    unsubscribe (event: string, callback: (data: T[]) => void) {
        this.EE.removeListener(event, callback)
    }

    buffer () {
        return this.innerBuffer.slice()
    }

    destory () {
        this.EE.removeAllListeners()
        this.connection?.close()
        this.connection = null
    }
}
