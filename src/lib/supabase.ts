import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcdlllokrcwocepcllxa.supabase.co'
const supabaseAnonKey = 'sb_publishable_zbZNYvLiCRieknd9FcuNBw_8fqptZp5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
