import create from 'zustand'

const useStore = create((set) => ({
  selected: null,
  select: (id) => set({ selected: id }),
  badge: null,
  setBadge: (b) => {
    set({ badge: b })
    if (b && b.timeout != null) {
      setTimeout(() => set({ badge: null }), b.timeout)
    }
  },
  pointsPopup: null,
  setPointsPopup: (p) => {
    set({ pointsPopup: p })
    if (p && p.timeout != null) {
      setTimeout(() => set({ pointsPopup: null }), p.timeout)
    }
  },
}))

export default useStore
