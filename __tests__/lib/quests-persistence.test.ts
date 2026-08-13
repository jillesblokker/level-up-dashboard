import { reconcileQuestList } from '@/lib/quests-persistence';

describe('reconcileQuestList', () => {
  it('should return server list if no local quests exist', () => {
    const serverQuests = [
      { id: 'q1', name: 'Brush teeth', completed: false },
      { id: 'q2', name: '10 Push-ups', completed: true }
    ];
    const result = reconcileQuestList(serverQuests, []);
    expect(result).toHaveLength(2);
    expect(result[0].completed).toBe(false);
    expect(result[1].completed).toBe(true);
  });

  it('should retain completed status if same day and local state is completed', () => {
    const serverQuests = [
      { id: 'q1', name: 'Brush teeth', completed: false }
    ];
    const localQuests = [
      { id: 'q1', name: 'Brush teeth', completed: true }
    ];
    const result = reconcileQuestList(serverQuests, localQuests, true);
    expect(result[0].completed).toBe(true);
  });

  it('should NOT retain local completed status if not same day (new day)', () => {
    const serverQuests = [
      { id: 'q1', name: 'Brush teeth', completed: false }
    ];
    const localQuests = [
      { id: 'q1', name: 'Brush teeth', completed: true }
    ];
    const result = reconcileQuestList(serverQuests, localQuests, false);
    expect(result[0].completed).toBe(false);
  });

  it('should match local quests by case-insensitive name or title', () => {
    const serverQuests = [
      { id: 'uuid-100', name: 'Read Chapter 1', title: 'Read Chapter 1', completed: false }
    ];
    const localQuests = [
      { id: 'uuid-100', name: 'read chapter 1', completed: true }
    ];
    const result = reconcileQuestList(serverQuests, localQuests, true);
    expect(result[0].completed).toBe(true);
  });
});
