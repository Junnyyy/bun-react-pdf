import './style-a.css'
import { greetB } from './circular-b.tsx'

export function greetA() {
  return "hello from A"
}

export default function CircularA() {
  return <div className="custom-class">{greetA()} {greetB()}</div>
}
