
/** BOSE GENERATED CHUNK: chunk_v514737bx **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const color = new Signal(state.color, 'color');
  const logic = () => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22d3ee'];
        color.value = colors[Math.floor(Math.random() * colors.length)];
    };
  logic(state, element);
  return {
    color: color.value
  };
}
          