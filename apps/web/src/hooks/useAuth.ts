import { useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'eventhorizon_token'

interface AuthState {
  token: string | null
  trader: {
    id: string
    walletAddress: string
    reputation: number
    predictionCount: number
  } | null
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const { address, isConnected, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem(TOKEN_KEY),
    trader: null,
    isLoading: false,
    error: null,
  })

  // Clear token when wallet disconnects or address changes
  useEffect(() => {
    if (!isConnected || !address) {
      setState(prev => ({
        ...prev,
        token: null,
        trader: null,
      }))
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [isConnected, address])

  // Verify existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && isConnected) {
      verifyToken(token)
    }
  }, [isConnected])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          token,
          trader: data.data,
        }))
      } else {
        // Token invalid, clear it
        localStorage.removeItem(TOKEN_KEY)
        setState(prev => ({
          ...prev,
          token: null,
          trader: null,
        }))
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setState(prev => ({
        ...prev,
        token: null,
        trader: null,
      }))
    }
  }

  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get nonce
      const nonceResponse = await fetch(`${API_URL}/auth/nonce?address=${address}`)
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { data: { nonce } } = await nonceResponse.json()

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to EventHorizon to submit predictions.',
        uri: window.location.origin,
        version: '1',
        chainId: chain?.id || 1,
        nonce,
      })

      const messageStr = message.prepareMessage()

      // Sign message
      const signature = await signMessageAsync({ message: messageStr })

      // Verify with backend
      const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageStr,
          signature,
        }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        throw new Error(error.error || 'Verification failed')
      }

      const { data } = await verifyResponse.json()

      // Store token
      localStorage.setItem(TOKEN_KEY, data.token)

      setState({
        token: data.token,
        trader: data.trader,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }))
    }
  }, [address, isConnected, chain, signMessageAsync])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setState({
      token: null,
      trader: null,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    isAuthenticated: !!state.token && !!state.trader,
    signIn,
    signOut,
  }
}
