import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";


export default function Draggable({id, children}: {id: string, children: React.ReactNode}) {
const { attributes, listeners, setNodeRef, transform } = useDraggable({
  id: id,
});
const style = {
  transform: CSS.Translate.toString(transform),
};
  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </button>
  );
}   