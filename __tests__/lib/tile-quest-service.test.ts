import { checkAndUnlockTileQuests, TILE_QUEST_DEFINITIONS } from '@/lib/tile-quest-service';

describe('tile-quest-service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should define tile quest definitions correctly', () => {
    expect(TILE_QUEST_DEFINITIONS).toHaveLength(2);
    expect(TILE_QUEST_DEFINITIONS[0].questName).toBe('Zen Garden Meditation');
    expect(TILE_QUEST_DEFINITIONS[1].questName).toBe('Complete 3 Dungeon Battles');
  });

  it('should do nothing if grid is empty or invalid', () => {
    expect(() => checkAndUnlockTileQuests([])).not.toThrow();
    expect(() => checkAndUnlockTileQuests(null as any)).not.toThrow();
  });
});
