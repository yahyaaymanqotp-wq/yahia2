import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

app.post('/create-shop-owner', async (req, res) => {
  console.log('REQUEST RECEIVED')
  console.log(req.body)

  try {
    const {
      email,
      password,
      full_name,
      shop_id
    } = req.body

    const { data, error } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

if (error) {
  return res.status(400).json({
    error: error.message
  })
}

const { error: profileError } =
  await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      email,
      full_name,
      role: 'shop_owner'
    })

if (profileError) {
  return res.status(400).json({
    error: profileError.message
  })
}

const { error: shopError } =
  await supabase
    .from('shops')
    .update({
      owner_id: data.user.id,
      owner_email: email
    })
    .eq('id', shop_id)

if (shopError) {
  return res.status(400).json({
    error: shopError.message
  })
}
    res.json({
      success: true,
      user_id: data.user.id
    })
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on ${process.env.PORT}`
  )
})