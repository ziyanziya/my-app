import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import confetti from 'canvas-confetti'
import useStore from '../store/useStore'

export default function useCompleteWorship() {
  const qc = useQueryClient()
  const setBadge = useStore.getState().setBadge
  return useMutation(async (id) => {
    await api.post(`/worships/${id}/complete`)
  }, {
    onMutate: async (id) => {
      await qc.cancelQueries(['worships'])
      const previous = qc.getQueryData(['worships'])
      qc.setQueryData(['worships'], (old = []) =>
        old.map((w) =>
          String(w.id) === String(id) ? { ...w, completed: true } : w
        )
      )
      return { previous }
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        qc.setQueryData(['worships'], context.previous)
      }
      setBadge({ text: 'فشل الإتمام', timeout: 2500 })
    },
    onSuccess(_, id) {
      qc.invalidateQueries(['worships'])
      // confetti burst
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      // determine points from cached worships
      try {
        const cached = qc.getQueryData(['worships']) || []
        const item = cached.find((w) => String(w.id) === String(id))
        const pts = item && item.points ? item.points : 0
        setBadge({ text: `تم الإتمام — +${pts} نقاط`, timeout: 3500 })
        try { useStore.getState().setPointsPopup({ text: `+${pts} نقاط`, timeout: 1800 }) } catch (e) {}
      } catch (e) {
        setBadge({ text: 'تم الإتمام', timeout: 3000 })
      }
    },
    onSettled: () => {
      qc.invalidateQueries(['worships'])
    }
  })
}
