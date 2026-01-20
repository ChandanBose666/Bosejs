
/** BOSE GENERATED CHUNK: chunk_mdq8155fc **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const count = new Signal(state.count, 'count');
  const logic = () => {
        count.value++;
    };
  return logic(state, element);
}
          