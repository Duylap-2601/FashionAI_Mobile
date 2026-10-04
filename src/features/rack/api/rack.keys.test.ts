import { rackKeys } from './rack.keys';

describe('rack query keys', () => {
  it('keeps the Rack list under a stable feature root', () => {
    expect(rackKeys.all).toEqual(['rack']);
    expect(rackKeys.list()).toEqual(['rack', 'list']);
  });
});
