'use client'

import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from '@/lib/authConfig'

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.initialize().catch((error) => {
  console.error('MSAL initialization error:', error);
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  )
}