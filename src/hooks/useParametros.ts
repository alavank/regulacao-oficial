import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Parametro } from '../types'

export function useParametros(categoria?: string) {
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('parametros')
        .select('*')
        .eq('ativo', true)
        .order('valor')

      if (categoria) query = query.eq('categoria', categoria)

      const { data } = await query
      if (data) setParametros(data as Parametro[])
      setLoading(false)
    }
    fetch()
  }, [categoria])

  return { parametros, loading }
}
