import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError, type AxiosInstance } from 'axios'
import { error as MessageError } from '@/components'
import {License} from "@/models";
import { useAtomValue} from "jotai";
import { secretStorageAtom} from "@/stores";

export interface Config {
    port: number
    'socks-port': number
    'redir-port': number
    'mixed-port': number
    'allow-lan': boolean
    mode: string
    'log-level': string
}

export interface Rules {
    rules: Rule[]
}

export interface Rule {
    type: string
    payload: string
    proxy: string
}

export interface Proxies {
    proxies: Record<string, Proxy | Group>
}

export interface Provider {
    name: string
    proxies: Array<Group | Proxy>
    type: 'Proxy'
    vehicleType: 'HTTP' | 'File' | 'Compatible'
    updatedAt?: string
}

export interface RuleProvider {
    name: string
    type: 'Rule'
    vehicleType: 'HTTP' | 'File'
    behavior: string
    ruleCount: number
    updatedAt?: string
}

export interface RuleProviders {
    providers: Record<string, RuleProvider>
}

export interface ProxyProviders {
    providers: Record<string, Provider>
}

interface History {
    time: string
    delay: number
    meanDelay?: number
}

export interface Proxy {
    name: string
    type: 'Direct' | 'Reject' | 'Shadowsocks' | 'Vmess' | 'Trojan' | 'Socks' | 'Http' | 'Snell'
    history: History[]
    udp: boolean
}

export interface Group {
    name: string
    type: 'Selector' | 'URLTest' | 'Fallback'
    now: string
    all: string[]
    history: History[]
}

export interface Snapshot {
    uploadTotal: number
    downloadTotal: number
    connections: Connections[]
}

export interface Connections {
    id: string
    metadata: {
        network: string
        type: string
        host: string
        processPath?: string
        sourceIP: string
        sourcePort: string
        destinationPort: string
        destinationIP?: string
    }
    upload: number
    download: number
    start: string
    chains: string[]
    rule: string
    rulePayload: string
}

export interface RequestErrorArg {
    message: string
    response?: any
    responseCode?: number
}

export class RequestError extends Error {
    config?: any

    response?: any

    responseCode?: number

    constructor(arg: RequestErrorArg) {
        const { message, response, responseCode } = arg
        super(message)

        this.name = 'RequestError'
        this.message = message
        this.response = response
        this.responseCode = responseCode
    }
}

function requestConfigError(error: RequestError) {
    return Promise.reject(error)
}
function responseAdaptor(response: AxiosResponse<any>): Promise<AxiosResponse> {
    const { code,result } = response.data
    if (code === 200||result===1) {
        return response.data
    }
    const serverResponseCode = response.data?.code
    const serverResponseMessage = response.data?.msg || '未知错误'

    MessageError(serverResponseMessage, 3000)
    return Promise.reject(
      new RequestError({
          responseCode: serverResponseCode,
          message: serverResponseMessage, // 错误信息
          response,
      }),
    )
}

function responseError(error: AxiosError) {
    // responseAdaptor 返回的reject不会进入到这里
    const status = error?.response?.status
    const code = error?.code
    let message = error?.message ?? ''
    if (status === 401) {
        // 需要登录
        message = '请登录'
    }
    if (code === 'ECONNABORTED') {
        message = '网络环境太差，请求超时'
    } else if (code === 'Network Error' || message === 'Network Error') {
        if (error.response) {
            message = `${error.response.status}:network连接失败，请求中断`
        } else {
            message = '网络好像出现问题哦'
        }
    }
    MessageError(message, 3000)
    return Promise.reject(error)
}

export class Client {
    private readonly axiosClient: AxiosInstance

    constructor (url: string, secret?: string) {
         // @ts-ignore
         const instance = axios.create({
             baseURL: url,
             headers: secret ? { Authorization: `Bearer ${secret}` } : {},
         })

        // 添加请求拦截器
        instance.interceptors.request.use((config) => config, requestConfigError)

        // 添加响应拦截器
        instance.interceptors.response.use(responseAdaptor, responseError)
        this.axiosClient = instance
    }

    async getConfig () {
        return await this.axiosClient.get<Config>('configs')
    }

    async updateConfig (config: Partial<Config>) {
        return await this.axiosClient.patch<void>('configs', config)
    }

    async getRules () {
        return await this.axiosClient.get<Rules>('rules')
    }

    async getProxyProviders () {
        const resp = await this.axiosClient.get<ProxyProviders>('providers/proxies', {
            validateStatus (status) {
                // compatible old version
                return (status >= 200 && status < 300) || status === 404
            },
        })
        return resp
    }

    async getRuleProviders () {
        return await this.axiosClient.get<RuleProviders>('providers/rules')
    }

    async updateProvider (name: string) {
        return await this.axiosClient.put<void>(`providers/proxies/${encodeURIComponent(name)}`)
    }

    async updateRuleProvider (name: string) {
        return await this.axiosClient.put<void>(`providers/rules/${encodeURIComponent(name)}`)
    }

    async healthCheckProvider (name: string) {
        return await this.axiosClient.get<void>(`providers/proxies/${encodeURIComponent(name)}/healthcheck`)
    }

    async getProxies () {
        return await this.axiosClient.get<Proxies>('proxies')
    }

    async getProxy (name: string) {
        return await this.axiosClient.get<Proxy>(`proxies/${encodeURIComponent(name)}`)
    }

    getVersion () {
        return Promise.resolve({version: '123123'})
    }

    async getProxyDelay (name: string) {
        return await this.axiosClient.get<{ delay: number }>(`proxies/${encodeURIComponent(name)}/delay`, {
            params: {
                timeout: 5000,
                url: 'http://www.gstatic.com/generate_204',
            },
        })
    }

    async closeAllConnections () {
        return await this.axiosClient.delete('connections')
    }

    async closeConnection (id: string) {
        return await this.axiosClient.delete(`connections/${id}`)
    }

    async getConnections () {
        return await this.axiosClient.get<Snapshot>('connections')
    }

    async changeProxySelected (name: string, select: string) {
        return await this.axiosClient.put<void>(`proxies/${encodeURIComponent(name)}`, { name: select })
    }
}

export class ServiceClient {
    private readonly axiosClient: AxiosInstance

    constructor (url: string) {
        // @ts-ignore
        const instance = axios.create({
            baseURL: url,
        })

        const serialKey =  useAtomValue(secretStorageAtom)
        // 添加请求拦截器
        instance.interceptors.request.use((config) => {

            console.log(serialKey)

            if(serialKey) {
                const { data, params } = config
               if(data) {
                   config.data = {
                       serialKey,
                       ...data,
                   }
               }else {
                   console.log(params)
                   // config.params = {
                   //     serialKey,
                   //     ...data,
                   // }
               }
            }
            return config
        }, requestConfigError)

        // 添加响应拦截器
        instance.interceptors.response.use(responseAdaptor, responseError)

        this.axiosClient = instance
    }

    getSockets () {
        return 'v1/ws'
    }

    async getActiveCodeTime (defaultSecret: string) {
        return await this.axiosClient.post<License>('api/v1/time', {
            serialKey: defaultSecret
        })
    }

    async getActiveSecret (code: string) {
        return await this.axiosClient.post<Config>('api/v1/check', {
            serialKey: code
        })
    }

    async getRoomInfo (liveUrlList: string[] ) {
        return await this.axiosClient.post<Config>('api/v1/getRoomInfo', {
            url: liveUrlList
        })
    }

    async getUserprofile (sec_uid: string[] ) {
        return await this.axiosClient.get<Config>(`https://api.mujiwork.cn/userprofile?sec_uid=${sec_uid}`)
    }
}
