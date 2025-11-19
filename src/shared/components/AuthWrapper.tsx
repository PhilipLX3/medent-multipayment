'use client'

import { useState, useEffect } from 'react'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [isAuth, setIsAuth] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const welcomeText = 'Medical Payment';

    useEffect(() => {
        // Check if already authenticated
        const authStatus = localStorage.getItem('basic_auth')
        if (authStatus === 'true') {
            setIsAuth(true)
        } else {
            setShowLoginModal(true)
        }
        setLoading(false)
    }, [])

    const handleAuth = async () => {
        if (!username.trim() || !password.trim()) {
            setError('ユーザー名とパスワードを入力してください')
            return
        }

        try {
            const response = await fetch('/api/auth/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password: password.trim() })
            })

            if (response.ok) {
                localStorage.setItem('basic_auth', 'true')
                setIsAuth(true)
                setShowLoginModal(false)
                setUsername('')
                setPassword('')
                setError('')
            } else {
                setError('認証情報が無効です')
            }
        } catch (error) {
            setError('認証エラーが発生しました')
        }
    }

    const openLoginModal = () => {
        setShowLoginModal(true)
        setError('')
    }

    const closeLoginModal = () => {
        setShowLoginModal(false)
        setUsername('')
        setPassword('')
        setError('')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAuth()
        }
    }

    if (loading) {
        return <></>
    }

    if (!isAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                {/* Welcome message only shows when modal is closed/cancelled */}
                {!showLoginModal && (
                    <div className="text-center">
                        <h1 className="text-xl font-semibold mb-4">{welcomeText}</h1>
                        <button
                            onClick={openLoginModal}
                            className="bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not rounded"
                        >
                            ログイン
                        </button>
                    </div>
                )}

                {/* Custom Login Modal */}
                {showLoginModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-lg font-semibold mb-4 text-center">{welcomeText}</h2>
                            <p className="text-sm text-gray-600 text-center mb-6">認証が必要です</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ユーザー名
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ユーザー名を入力"
                                        autoFocus
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        パスワード
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="パスワードを入力"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                        {error}
                                    </div>
                                )}

                                <div className="flex space-x-3 mt-6">
                                    <button
                                        onClick={closeLoginModal}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleAuth}
                                        className="flex-1 bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not rounded transition-colors"
                                    >
                                        ログイン
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return <>{children}</>
}