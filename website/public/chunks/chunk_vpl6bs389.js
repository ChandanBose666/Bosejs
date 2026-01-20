
/** BOSE GENERATED CHUNK: chunk_vpl6bs389 **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const count = new Signal(state.count, 'count');
  const logic = () => {
        count.value = 0;
    };
  logic(state, element);
  return {
    count: count.value
  };
}
          