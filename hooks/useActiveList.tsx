import { createContext, useContext, useState } from 'react'
type ActiveListContextType = {
  activeList: string | null
  setActiveList: (id: string) => void
}
const ActiveListContext = createContext<ActiveListContextType | null>(null)

export const ActiveListProvider = ({ children }) => {
  const [activeList, setActiveList] = useState(null)
  return (
    <ActiveListContext.Provider value={{ activeList, setActiveList }}>
      {children}
    </ActiveListContext.Provider>
  )
}

const useActiveList = () => {
  const ctx = useContext(ActiveListContext)
  if (!ctx) {
    throw new Error(
      'useActiveList must be used in a component inside ActiveListProvider'
    )
  }
}

export default useActiveList
