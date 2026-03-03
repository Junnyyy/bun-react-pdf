import type { ReactNode } from 'react'
import './style-a.css'

export default function TypeOnly({ children }: { children?: ReactNode }) {
  return <div className="custom-class">{children}</div>
}
