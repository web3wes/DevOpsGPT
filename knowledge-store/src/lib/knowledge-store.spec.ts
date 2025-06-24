import { ensureCollection } from './knowledge-store.js';

jest.mock('@qdrant/js-client-rest', () => {
  return {
    QdrantClient: jest.fn().mockImplementation(() => ({
      getCollections: jest.fn().mockResolvedValue({ collections: [] }),
      createCollection: jest.fn().mockResolvedValue({}),
      upsert: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue([]),
    })),
  };
});

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({ data: [{ embedding: new Array(3).fill(0.1) }] }),
      },
    })),
  };
});

describe('knowledge-store', () => {
  it('ensureCollection runs without error', async () => {
    await expect(ensureCollection(3)).resolves.not.toThrow();
  });
});
