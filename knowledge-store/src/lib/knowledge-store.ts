import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import type { FailureContext } from '@devopsgpt/types';

const COLLECTION = process.env.QDRANT_COLLECTION || 'build_issues';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function ensureCollection(dimension = 1536) {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.find((c) => c.name === COLLECTION);
  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: dimension, distance: 'Cosine' },
    });
  }
}

export async function embedText(text: string): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  // @ts-ignore
  return resp.data[0].embedding as number[];
}

export interface EmbeddableDoc {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export async function upsertEmbedding(doc: EmbeddableDoc) {
  await ensureCollection();
  const vector = await embedText(doc.text);
  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: [
      {
        id: doc.id,
        vector,
        payload: doc.metadata,
      },
    ],
  });
}

export async function querySimilar(
  query: string,
  topK = 5
): Promise<EmbeddableDoc[]> {
  await ensureCollection();
  const vector = await embedText(query);
  const res = await qdrant.search(COLLECTION, {
    vector,
    limit: topK,
  });
  return res.map((p) => ({
    id: String(p.id),
    text: '',
    metadata: p.payload ?? {},
  }));
}

// Example nightly sync (to be triggered by cron outside runtime)
export async function syncFailureContext(ctx: FailureContext) {
  const combinedText = `${ctx.failedTests.map((t) => t.message).join('\n')}`;
  await upsertEmbedding({
    id: ctx.buildId,
    text: combinedText,
    metadata: { repo: ctx.repo, buildId: ctx.buildId },
  });
}
