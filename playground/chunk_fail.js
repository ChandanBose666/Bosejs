/**
 * This chunk deliberately fails to demonstrate Error Boundaries.
 */
export default function(state) {
    console.log('[Chunk] Simulating failure...');
    throw new Error("Critical logic failure in 'chunk_fail.js'");
}
