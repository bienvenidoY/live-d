import classnames from 'classnames'
import { Route, Navigate, Routes, useLocation, Outlet } from 'react-router-dom'
import {useAtom} from "jotai";

import ExternalControllerModal from '@/containers/ExternalControllerDrawer'
import Instructions from '@/containers/Instructions'
import LiveDanmu from '@/containers/LiveDanmu'

import Settings from '@/containers/Settings'
import SideBar from '@/containers/Sidebar'

import '../styles/common.scss'
import '../styles/iconfont.scss'

export default function App () {

    const location = useLocation()

    const routes = [
        { path: '/instructions', name: 'Instructions', element: <Instructions /> },
        { path: '/live-danmu', name: 'LiveDanmu', element: <LiveDanmu /> },
        { path: '/settings', name: 'Settings', element: <Settings /> },
    ]

    const layout = (
        <div className={classnames('app', 'not-clashx')}>
            <SideBar routes={routes} />
            <div className="page-container">
                <Outlet />
            </div>

            <ExternalControllerModal />
        </div>
    )

    return (
        <Routes>
            <Route path="/" element={layout}>
                <Route path="/" element={<Navigate to={{ pathname: '/instructions', search: location.search }} replace />} />
                {
                    routes.map(
                        route => <Route path={route.path} key={route.path} element={route.element} />,
                    )
                }
            </Route>
        </Routes>
    )
}
