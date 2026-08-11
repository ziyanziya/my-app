import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useWorships from './hooks/useWorships'
import useCompleteWorship from './hooks/useCompleteWorship'
import Wheel from './components/Wheel'
import useStore from './store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import PointsPopup from './components/PointsPopup'
import { io } from 'socket.io-client'

export default function App({ queryClient }) {
  const { data = [], isLoading } = useWorships()
  const qc = useQueryClient()
  const selectedId = useStore((s) => s.selected)
  const complete = useCompleteWorship()

  React.useEffect(() => {
    const socket = io('http://localhost:5000')
    socket.on('connect', () => console.log('socket connected', socket.id))
    socket.on('worship:completed', (payload) => {
      // invalidate worships so UI refreshes
      qc.invalidateQueries(['worships'])
    })
    return () => socket.close()
  }, [qc])

  return (
    <div className="app-root">
      <div className="top-badge-root">
        <AnimatePresence>
          {useStore((s) => s.badge) ? (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="top-badge"
              key={useStore((s) => s.badge).text}
            >
              {useStore((s) => s.badge).text}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <PointsPopup />
      <header className="header">صراط — الأذكار والعبادات</header>
      <main className="main">
        {isLoading ? (
          <div>Loading…</div>
        ) : (
          <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
            <Wheel items={data} />
            <aside style={{width:320}}>
              {selectedId ? (
                (() => {
                  const item = data.find(d=>d.id===selectedId)
                  if(!item) return <div>No item</div>
                  return (
                    <div style={{background:'rgba(255,255,255,0.03)',padding:16,borderRadius:8}}>
                      <h3 style={{marginTop:0}}>{item.name}</h3>
                      <p style={{opacity:0.85}}>{item.description}</p>
                      <div style={{marginTop:12}}>
                        <button
                          onClick={() => complete.mutate(item.id)}
                          disabled={item.completed || complete.isLoading}
                          style={{
                            padding:'8px 12px',
                            background:item.completed ? '#64748b' : '#0ea5a4',
                            color:'#fff',
                            border:'none',
                            borderRadius:6,
                            opacity:item.completed ? 0.65 : 1,
                            cursor:item.completed ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {item.completed ? 'مكتمل' : complete.isLoading ? 'جاري الإتمام...' : 'أتممت'}
                        </button>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div style={{padding:16}}>اختر بنداً لعرض التفاصيل</div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
