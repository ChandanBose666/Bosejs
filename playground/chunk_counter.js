/**
 * This is a "Bose Chunk".
 * It contains ONLY the logic for a single interaction.
 * It is completely stateless; state is passed in.
 */
export default function(state) {
    console.log('[Chunk] Executing counter logic with state:', state);
    return {
        ...state,
        count: state.count + 1
    };
}
