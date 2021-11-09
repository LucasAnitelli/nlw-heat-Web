import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    nome: string;
    login: string;
  }
}

interface User {
  id: string;
  nome: string;
  login: string;
  avatar_url: string;
}

interface AuthContextData {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

interface AuthProvicer {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export const AuthProvider = ({ children }: AuthProvicer) => {
  const [user, setUser] = useState<User | null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=bd10993951869a24b5b2`

  const signIn = async (githubCode: string) => {
    const response = await api.post<AuthResponse>('authenticate', {
      code: githubCode,
    })

    const { token, user } = response.data

    localStorage.setItem('@dowhile:token', token)
    api.defaults.headers.common.authorization = `Bearer ${token}`

    setUser(user)
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('@dowhile:token')
  }

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=')

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=')

      window.history.pushState({}, '', urlWithoutCode)

      signIn(githubCode)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`

      api.get<User>('profile').then(response => {
        setUser(response.data)
      })
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      signInUrl,
      signOut
    }}>
      {children}
    </AuthContext.Provider>

  )
}