
/** BOSE GENERATED CHUNK: chunk_c01g7o57j **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const count = new Signal(state.count, 'count');
  const logic = () => {
        count.value++;
    };
  logic(state, element);
  return {
    count: count.value
  };
}
          