import { renderHook, act } from '@testing-library/react';
import { useGroupMembers } from './useGroupMembers';

// Mock fetch
const globalAny: any = global;

describe('useGroupMembers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    globalAny.fetch = jest.fn();
  });

  it('returns empty if no groupId', async () => {
    const { result } = renderHook(() => useGroupMembers(undefined));
    expect(result.current.members).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches and normalizes members', async () => {
    const fakeMembers = [
      { id: '1', fullName: 'A', mobileNumber: '123', groupId: 'G' },
      { userId: '2', name: 'B', phone: '456', group_id: 'G' },
    ];
    globalAny.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groupMembers: fakeMembers }),
    });
    const { result, waitForNextUpdate } = renderHook(() => useGroupMembers('G'));
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.members.length).toBe(2);
    expect(result.current.members[0].id).toBe('1');
    expect(result.current.members[1].id).toBe('2');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    globalAny.fetch.mockResolvedValueOnce({ ok: false });
    const { result, waitForNextUpdate } = renderHook(() => useGroupMembers('BAD'));
    await waitForNextUpdate();
    expect(result.current.error).toBeTruthy();
    expect(result.current.members).toEqual([]);
  });

  it('refreshes and updates cache', async () => {
    let call = 0;
    globalAny.fetch.mockImplementation(() => {
      call++;
      return Promise.resolve({
        ok: true,
        json: async () => ({ groupMembers: [{ id: String(call), name: 'N' + call }] }),
      });
    });
    const { result, waitForNextUpdate } = renderHook(() => useGroupMembers('G2'));
    await waitForNextUpdate();
    expect(result.current.members[0].id).toBe('1');
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.members[0].id).toBe('2');
  });
});
