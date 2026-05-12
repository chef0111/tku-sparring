import { describe, expect, it, vi } from 'vitest';
import { getOrCreateStoredDeviceId } from './use-device-id';

/** Satisfies `Crypto['randomUUID']` return type in tests (plain `string` is not assignable). */
const mockRandomUuid = (value: string) =>
  value as ReturnType<Crypto['randomUUID']>;

const generatedUuid = mockRandomUuid('11111111-1111-4111-8111-111111111111');

describe('getOrCreateStoredDeviceId', () => {
  it('returns the existing stored device id without generating a new one', () => {
    const storage = {
      getItem: vi.fn(() => 'device-existing'),
      setItem: vi.fn(),
    };
    const crypto = {
      randomUUID: vi.fn(() => generatedUuid),
    };

    const result = getOrCreateStoredDeviceId(storage, crypto);

    expect(result).toBe('device-existing');
    expect(storage.getItem).toHaveBeenCalledWith('tku-device-id');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });

  it('generates and persists a device id when storage is empty', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    const crypto = {
      randomUUID: vi.fn(() => generatedUuid),
    };

    const result = getOrCreateStoredDeviceId(storage, crypto);

    expect(result).toBe(generatedUuid);
    expect(storage.setItem).toHaveBeenCalledWith(
      'tku-device-id',
      generatedUuid
    );
  });

  it('still returns a generated device id when localStorage writes fail', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
    };
    const crypto = {
      randomUUID: vi.fn(() => generatedUuid),
    };

    const result = getOrCreateStoredDeviceId(storage, crypto);

    expect(result).toBe(generatedUuid);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
});
