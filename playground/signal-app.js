import { useSignal } from '@bose/state';

export default function SignalCounter() {
    const count = useSignal(0, 'count');
    
    const increment = $(() => {
        count.value++;
    });

    return `
        <div class="signal-island">
            <h3>Signal Counter</h3>
            <p>Remote Display: <span bose:bind="count">0</span></p>
            <button bose:on:click="${increment.chunk}" bose:state='{"count": 0}'>
                Increment Global Signal
            </button>
        </div>
    `;
}
