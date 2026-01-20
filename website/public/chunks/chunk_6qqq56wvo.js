
/** BOSE GENERATED CHUNK: chunk_6qqq56wvo **/
import { Signal } from '@bose/state';

export default function(state, element) {
  const count = new Signal(state.count, 'count');
  const logic = () => {
        count.value++;
    };
  return logic(state, element);
}
          