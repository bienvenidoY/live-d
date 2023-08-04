import React from "react";
import {createRoot} from 'react-dom/client'
import './style.scss'

interface RightMenuProps {
    close: () => void
}

export const RightMenu: React.FC = (props: RightMenuProps) => {
    return (
        <div className="contextMenu-box-center">
            <div className='contextMenu-box-center-item' onClick={() => props.close()}>抓取</div>
            <div className='contextMenu-box-center-item'>停止</div>
            <div className='contextMenu-box-center-item'>打开直播间</div>
            <div className='contextMenu-box-center-item'>删除直播间</div>
            <div className='contextMenu-box-center-item'>导出所有直播间</div>
            <div className='contextMenu-box-center-item'>清空</div>
        </div>
    )
}

// 打开右键菜单
export const openRightMenu = (x: number, y: number) => {
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

    function close() {
        root.unmount()
        removeListener()
        document.body.removeChild(div)
    }

    const root = createRoot(div)
    root.render(<RightMenu close={close}/>)
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
