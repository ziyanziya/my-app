import { useQuery } from '@tanstack/react-query'
import api from '../api'

export default function useWorships() {
  return useQuery(['worships'], async () => {
    const res = await api.get('/worships')
    return res.data && res.data.data ? res.data.data : []
  })
}
