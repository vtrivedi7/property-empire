import { useState } from 'react'
import { useUserStore } from '@/lib/stores/user-store'

export default function UserSelector() {
  const [inputUserId, setInputUserId] = useState('')
  const { userId, setUserId, resetUser, isLoading, error } = useUserStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUserId.trim()) {
      setUserId(inputUserId.trim())
    }
  }

  const handleLogout = () => {
    resetUser()
    setInputUserId('')
  }

  if (userId) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Playing as: {userId}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Switch User
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome to Property Empire</h1>
        <div className="space-y-4">
          <label htmlFor="username" className="block text-lg font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={inputUserId}
            onChange={(e) => setInputUserId(e.target.value)}
            className="block w-full px-4 py-3 rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg"
            placeholder="Enter your username"
          />
          <button
            type="submit"
            disabled={isLoading || !inputUserId.trim()}
            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? 'Loading...' : 'Start Playing'}
          </button>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </form>
  )
} 