import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'

export default function PointsPopup() {
  const popup = useStore((s) => s.pointsPopup)
  return (
    <div style={{position:'fixed',left:'50%',top:'45%',transform:'translateX(-50%)',pointerEvents:'none',zIndex:80}}>
      <AnimatePresence>
        {popup ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{background:'linear-gradient(90deg,#f97316,#f59e0b)',color:'#041014',padding:'10px 16px',borderRadius:12,fontWeight:800,boxShadow:'0 8px 24px rgba(0,0,0,0.35)'}}
          >
            {popup.text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
