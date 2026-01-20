
/** BOSE GENERATED CHUNK: chunk_lj4xudh7p **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const count = new Signal(state.count, 'count');
  const logic = () => {
        count.value--;
    };
  logic(state, element);
  return {
    count: count.value
  };
}
          