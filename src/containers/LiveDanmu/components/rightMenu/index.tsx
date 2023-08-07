import React from "react";
import classnames from 'classnames'
import {createRoot} from 'react-dom/client'
import './style.scss'
import {ConnectEnum, LiveStatsType} from "@/containers/LiveDanmu";

export interface MenuListType {
    type: string
    text: string
}

interface RightMenuProps {
    close: (item: MenuListType) => void
    menuList: MenuListType[],
    itemData: {}
}

export const RightMenu: React.FC = (props: RightMenuProps) => {
    const btnClick = (item) => {
        if(item.isDisabled) return
        props.close(item)
    }

    const menuList: ({isDisabled: boolean}&MenuListType)[] = props.menuList.map(v => {
        const { roomStatus, connectStatus } = props.itemData

        const isDisabled = roomStatus === LiveStatsType['未开播']
          ? ['start', 'stop', 'openLive'].includes(v.type)   // 未开播
          // 已经开播
          : ConnectEnum['正在抓取'] === connectStatus ? ['start'].includes(v.type) // 未抓取
            : ['stop'].includes(v.type) // 已抓取
        return {
            ...v,
            isDisabled,
        }
    })

    return (
        <div className="contextMenu-box-center">
            {menuList.map((item) => {
                return  <div
                  key={item.type}
                             onClick={() => btnClick(item)}
                  className={classnames('contextMenu-box-center-item', {'disabled': item.isDisabled} )}
                >{item.text}</div>
            })}
        </div>
    )
}

RightMenu.defaultProps = {
    menuList: [
        {type: 'start', text: '抓取',},
        {type: 'stop', text: '停止',},
        {type: 'openLive', text: '打开直播间',},
        {type: 'remove', text: '删除直播间',},
        {type: 'export', text: '导出所有直播间',},
        {type: 'clearAll', text: '清空',},
    ],
}

// 打开右键菜单
export const openRightMenu = (x: number, y: number, itemData, callBack: (menuItem: MenuListType) => void) => {
    const contextMenu = document.getElementById('contextMenu-box')
    if (contextMenu) {
        contextMenu.style.top = y + 'px'
        contextMenu.style.left = x + 'px'
        return
    }
    const div = document.createElement('div')
    div.id = 'contextMenu-box'
    div.style.position = 'fixed'
    div.style.left = x + 'px'
    div.style.top = y + 'px'
    div.style.zIndex = '999'
    document.body.appendChild(div)
    const removeListener = useWindowClick(div, () => document.body.removeChild(div))

    function close(menuItem: MenuListType) {
        callBack(menuItem)
        root.unmount()
        removeListener()
        document.body.removeChild(div)
    }

    const root = createRoot(div)
    root.render(<RightMenu close={close} itemData={itemData} />)
}


// 点击目标区域以外的地方移除目标区域
const useWindowClick = (el: HTMLElement | string, cb: () => void) => {
    let ele: HTMLElement | null
    if (typeof el === 'string') {
        ele = document.getElementById(el)
    } else {
        ele = el
    }
    if (!ele) {
        throw new Error('元素未找到！')
    }
    const fn = (e: MouseEvent) => {
        // @ts-expect-error
        if (e.target !== ele && !ele?.contains(e.target)) {
            removeListener()
            cb()
        }
    }
    document.addEventListener('click', fn)
    const removeListener = () => {
        document.removeEventListener('click', fn)
    }
    return removeListener
}
