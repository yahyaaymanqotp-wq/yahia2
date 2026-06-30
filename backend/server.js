import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // لازم Service Role مش Anon

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

app.post('/create-shop-owner', async (req, res) => {
  console.log('REQUEST RECEIVED:', req.body)

  try {
    const { email, password, full_name, shop_id } = req.body

    if (!email || !password || !full_name || !shop_id) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    // 1. إنشاء اليوزر
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (authError) {
      console.error('Auth Error:', authError)
      return res.status(400).json({
        error: authError.message
      })
    }

    // 2. إنشاء البروفايل
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role: 'shop_owner'
      })

    if (profileError) {
      console.error('Profile Error:', profileError)
      // احذف اليوزر لو البروفايل فشل
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(400).json({
        error: profileError.message
      })
    }

    // 3. ربط المحل بالمالك
    const { error: shopError } = await supabase
      .from('shops')
      .update({
        owner_id: authData.user.id,
        owner_email: email
      })
      .eq('id', shop_id)

    if (shopError) {
      console.error('Shop Error:', shopError)
      // احذف اليوزر والبروفايل لو الربط فشل
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('profiles').delete().eq('id', authData.user.id)
      return res.status(400).json({
        error: shopError.message
      })
    }

    console.log('Shop owner created successfully:', authData.user.id)

    res.json({
      success: true,
      user_id: authData.user.id
    })

  } catch (err) {
    console.error('Server Error:', err)
    res.status(500).json({
      error: err.message
    })
  }
})

// Route للتيست
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})