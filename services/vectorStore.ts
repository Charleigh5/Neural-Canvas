
/**
 * VECTORSTORE.TS - Local Semantic Matching Engine
 * Implements high-performance similarity calculations 
 * to enable instant search without server-side database.
 */

export class VectorStore {
    /**
     * Calculates Cosine Similarity between two numeric vectors.
     * Returns a score between -1 and 1 (closer to 1 = more similar).
     */
    static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0;
        
        let dotProduct = 0;
        let mA = 0;
        let mB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            mA += vecA[i] * vecA[i];
            mB += vecB[i] * vecB[i];
        }
        
        mA = Math.sqrt(mA);
        mB = Math.sqrt(mB);
        
        if (mA === 0 || mB === 0) return 0;
        
        return dotProduct / (mA * mB);
    }

    /**
     * Ranks a set of candidates against a query vector.
     * @param query The search vector
     * @param candidates Array of { id, embedding }
     * @param threshold Minimum similarity score to include
     */
    static rank(
        query: number[], 
        candidates: { id: string; embedding: number[] }[], 
        threshold: number = 0.6
    ): string[] {
        return candidates
            .map(c => ({
                id: c.id,
                score: this.cosineSimilarity(query, c.embedding)
            }))
            .filter(c => c.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .map(c => c.id);
    }
}
