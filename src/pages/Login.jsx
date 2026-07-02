import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, EyeOff, Eye } from 'lucide-react' // هنا المشكلة
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${username}@local.app`, // إيميل وهمي من اليوزرنيم
        password: password
      })

      if (signInError) throw new Error('اليوزرنيم أو كلمة المرور غلط')

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4" dir="rtl">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400">ادخل باليوزرنيم والباسورد</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-2 text-gray-400">اليوزرنيم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none text-white"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none text-white"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-gray-500"
              >
                {showPassword? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {loading? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}