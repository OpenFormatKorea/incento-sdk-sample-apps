import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Incento from './incento.service'

const INCENTO_WIDGET_ALLOW_PAGES = ['/', '/mypage']

export function Layout() {
  const location = useLocation()

  useEffect(() => {
    if (INCENTO_WIDGET_ALLOW_PAGES.includes(location.pathname)) {
      Incento.show()
    } else {
      Incento.hide()
    }
  }, [location.pathname])

  return <Outlet />
}
