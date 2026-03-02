import { SiblingA } from './sibling-a.tsx'
import { SiblingB } from './sibling-b.tsx'

export default function ParentWithSiblings() {
  return <div><SiblingA /><SiblingB /></div>
}
