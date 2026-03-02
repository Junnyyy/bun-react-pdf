import './style-a.css'
import { SubComponent } from './sub-component.tsx'

export default function Parent() {
  return <div className="custom-class"><SubComponent /></div>
}
