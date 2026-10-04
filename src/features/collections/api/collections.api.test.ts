import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';
import { getPublishedCollections } from './collections.api';

describe('collections API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('normalizes transport failures through the shared HTTP boundary', async () => {
    mock.onGet(ENDPOINTS.COLLECTIONS.PUBLISHED).networkError();

    const error = await getPublishedCollections().catch(
      (value: unknown) => value,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', statusCode: 0 });
  });
});
