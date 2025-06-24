import { apiWebhooks } from './api-webhooks';

describe('apiWebhooks', () => {
  it('should work', () => {
    expect(apiWebhooks()).toEqual('api-webhooks');
  });
});
