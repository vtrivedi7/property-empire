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
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg">
      <div className="space-y-2">
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
          Enter User ID
        </label>
        <input
          type="text"
          id="userId"
          value={inputUserId}
          onChange={(e) => setInputUserId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter your user ID"
        />
        <button
          type="submit"
          disabled={isLoading || !inputUserId.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Start Playing'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  )
} 