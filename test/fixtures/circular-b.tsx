import './style-b.css'
import { greetA } from './circular-a.tsx'

export function greetB() {
  return "hello from B"
}

export default function CircularB() {
  return <div className="another-class">{greetB()} {greetA()}</div>
}
