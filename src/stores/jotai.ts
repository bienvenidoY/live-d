import { usePreviousDistinct
    , useSyncedRef } from '@react-hookz/web'
import { type AxiosError } from 'axios'
import { produce } from 'immer'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { atomWithImmer } from 'jotai-immer'
import { get } from 'lodash-es'
import { ResultAsync } from 'neverthrow'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { type Get } from 'type-fest'

import { Language, locales, type Lang, getDefaultLanguage, type LocalizedType } from '@/i18n'
import { partition } from '@/lib/helper'
import { useWarpImmerSetter, type WritableDraft } from '@/lib/jotai'
import { isClashX, jsBridge } from '@/lib/jsBridge'
import type * as API from '@/lib/request'
import { StreamReader } from '@/lib/streamer'
import { type Infer } from '@/lib/type'
import type * as Models from '@/models'
import { type Log } from '@/models/Log'

import {useAPIInfo, useClient, useServiceAPIInfo, useServiceClient} from './request'

export const identityAtom = atom(true)
export const identityDialogAtom = atom(false)
export const licenseAtom = atom<Models.License>({expireTime: ''})

export const languageAtom = atomWithStorage<Lang | undefined>('language', undefined)
export const secretStorageAtom = atomWithStorage<string| undefined>('secret', undefined)

export function useI18n () {
    const [defaultLang, setLang] = useAtom(languageAtom)
    const lang = useMemo(() => defaultLang ?? getDefaultLanguage(), [defaultLang])

    const translation = useCallback(
        function <Namespace extends keyof LocalizedType>(namespace: Namespace) {
            function t<Path extends Infer<LocalizedType[Namespace]>> (path: Path) {
                return get(Language[lang][namespace], path) as unknown as Get<LocalizedType[Namespace], Path>
            }
            return { t }
        },
        [lang],
    )

    return { lang, locales, setLang, translation }
}

export const version = atom({
    version: '123123',
})

export function useVersion () {
    const [data, set] = useAtom(version)
    const client = useClient()
    const setIdentity = useSetAtom(identityAtom)
    useSWR([client], async function () {
        const result = await ResultAsync.fromPromise(client.getVersion(), e => e as AxiosError)

        setIdentity(result.isOk())
        set(
            result.isErr()
                ? { version: '123' }
                : { version: result.value.version },
        )
    })

    return data
}

export const configAtom = atomWithStorage('profile', {
    breakConnections: false,
    logLevel: '',
})

export function useConfig () {
    const [data, set] = useAtom(configAtom)

    const setter = useCallback((f: WritableDraft<typeof data>) => {
        set(produce(data, f))
    }, [data, set])

    return { data, set: useWarpImmerSetter(setter) }
}

export const proxyProvider = atom([] as API.Provider[])

export function useProxyProviders () {
    const [providers, set] = useAtom(proxyProvider)
    const client = useClient()

    const { data, mutate } = useSWR(['/providers/proxy', client], async () => {
        const proxyProviders = await client.getProxyProviders()

        return Object.keys(proxyProviders.data.providers)
            .map<API.Provider>(name => proxyProviders.data.providers[name])
            .filter(pd => pd.name !== 'default')
            .filter(pd => pd.vehicleType !== 'Compatible')
    })

    useEffect(() => { set(data ?? []) }, [data, set])
    return { providers, update: mutate }
}


export const proxies = atomWithImmer({
    proxies: [] as API.Proxy[],
    groups: [] as API.Group[],
    global: {
        name: 'GLOBAL',
        type: 'Selector',
        now: '',
        history: [],
        all: [],
    } as API.Group,
})

export function useProxy () {
    const [allProxy, rawSet] = useAtom(proxies)
    const set = useWarpImmerSetter(rawSet)
    const client = useClient()

    const { mutate } = useSWR(['/proxies', client], async () => {
        const allProxies = await client.getProxies()

        const global = allProxies.data.proxies.GLOBAL as API.Group
        // fix missing name
        global.name = 'GLOBAL'

        const policyGroup = new Set(['Selector', 'URLTest', 'Fallback', 'LoadBalance'])
        const unUsedProxy = new Set(['DIRECT', 'REJECT', 'GLOBAL'])
        const proxies = global.all
            .filter(key => !unUsedProxy.has(key))
            .map(key => ({ ...allProxies.data.proxies[key], name: key }))
        const [proxy, groups] = partition(proxies, proxy => !policyGroup.has(proxy.type))
        set({ proxies: proxy as API.Proxy[], groups: groups as API.Group[], global })
    }, {shouldRetryOnError: false})

    const markProxySelected = useCallback((name: string, selected: string) => {
        set(draft => {
            if (name === 'GLOBAL') {
                draft.global.now = selected
            }
            for (const group of draft.groups) {
                if (group.name === name) {
                    group.now = selected
                }
            }
        })
    }, [set])

    return {
        proxies: allProxy.proxies,
        groups: allProxy.groups,
        global: allProxy.global,
        update: mutate,
        markProxySelected,
        set,
    }
}

export const proxyMapping = atom((get) => {
    const ps = get(proxies)
    const providers = get(proxyProvider)
    const proxyMap = new Map<string, API.Proxy>()
    for (const p of ps.proxies) {
        proxyMap.set(p.name, p)
    }

    for (const provider of providers) {
        for (const p of provider.proxies) {
            proxyMap.set(p.name, p as API.Proxy)
        }
    }

    return proxyMap
})


export const rules = atomWithImmer([] as API.Rule[])

export function useRule () {
    const [data, rawSet] = useAtom(rules)
    const set = useWarpImmerSetter(rawSet)
    const client = useClient()

    async function update () {
        const resp = await client.getRules()
        set(resp.data.rules)
    }

    return { rules: data, update }
}

export function useConnectionStreamReader () {
    const apiInfo = useAPIInfo()

    const connection = useRef(new StreamReader<API.Snapshot>({ bufferLength: 200 }))

    const protocol = apiInfo.protocol === 'http:' ? 'ws:' : 'wss:'
    const url = `${protocol}//${apiInfo.hostname}:${apiInfo.port}/connections?token=${encodeURIComponent(apiInfo.secret)}`

    useEffect(() => {
        connection.current.connect(url)
    }, [url])

    return connection.current
}

const roomLogsAtom = atom(new StreamReader<Log>({ bufferLength: 200 }))
export function useRoomStreamReader () {
    const apiInfo = useServiceAPIInfo()
    const item = useAtomValue(roomLogsAtom)
    const client = useServiceClient()
    const previousKey = usePreviousDistinct(
      `${apiInfo.protocol}//${apiInfo.hostname}/${client.getSockets()}`,
    )

    const apiInfoRef = useSyncedRef(apiInfo)

    useEffect(() => {
        const apiInfo = apiInfoRef.current
        const protocol = apiInfo.protocol === 'http:' ? 'ws:' : 'wss:'
        const logUrl = `${protocol}//${apiInfo.hostname}/${client.getSockets()}`
        item.connect(logUrl)
    }, [apiInfoRef, item, previousKey])

    return item
}
