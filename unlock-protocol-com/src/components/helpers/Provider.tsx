import { ReactNode, useEffect, useState } from 'react'
import { UNLOCK_CONSOLE_MESSAGE } from '@unlock-protocol/core'
import useLocalStorage from 'use-local-storage'
import reactGa from 'react-ga'
import tagManager from 'react-gtm-module'
import { unlockConfig } from '../../config/unlock'
import { paywallConfig } from '../../config/paywallConfig'
import { Provider as MembershipProvider } from '../../hooks/useMembership'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  children: ReactNode
}

declare global {
  interface Window {
    unlockProtocol: {
      loadCheckoutModal(): void
    }
    unlockProtocolConfig: unknown
  }
}

export function Provider({ children }: Props) {
  const [enableAnalytics] = useLocalStorage('enable_analytics', null)
  const [isMember, setIsMember] = useState('is_member')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.info(UNLOCK_CONSOLE_MESSAGE)
  }, [])

  useEffect(() => {
    if (enableAnalytics) {
      reactGa.initialize(unlockConfig.gaId!)
      reactGa.set({ anonymizeIp: true })
      tagManager.initialize({ gtmId: unlockConfig.gaTmId! })
    }
  }, [enableAnalytics])

  useEffect(() => {
    if (enableAnalytics) {
      const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      reactGa.pageview(url)
    }
  }, [pathname, searchParams, enableAnalytics])

  function becomeMember() {
    return window.unlockProtocol && window.unlockProtocol.loadCheckoutModal()
  }

  useEffect(() => {
    // Make sure the config is correct!
    window.unlockProtocolConfig = paywallConfig
    const existingScript = document.getElementById('unlock-protocol')

    if (!existingScript) {
      const script = document.createElement('script')

      script.innerText = `(function(d, s) {
        var js = d.createElement(s),
          sc = d.getElementsByTagName(s)[0];
        js.src="https://paywall.unlock-protocol.com/static/unlock.latest.min.js?alpha=true";
        sc.parentNode.insertBefore(js, sc); }(document, "script"));
      `.trim()
      document.body.appendChild(script)

      window.addEventListener('unlockProtocol.status', (event: any) => {
        if (event?.detail?.state === 'locked') {
          setIsMember('no')
        } else if (event?.detail?.state === 'unlocked') {
          setIsMember('yes')
        }
      })
    }
    // cleanup
    return () => {
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [setIsMember])
  return (
    <MembershipProvider
      value={{
        isMember,
        becomeMember,
      }}
    >
      {children}
    </MembershipProvider>
  )
}
