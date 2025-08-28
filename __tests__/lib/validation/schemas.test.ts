import { 
  questSchema, 
  challengeSchema, 
  userSchema, 
  questCompletionSchema,
  validateSchema,
  safeParse,
  questFormSchema,
  questFiltersSchema,
  dateRangeSchema
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('Quest Schema', () => {
    const validQuest = {
      title: 'Test Quest',
      description: 'A test quest description',
      category: 'might',
      difficulty: 'easy',
      xp: 50,
      gold: 25,
      tags: ['test', 'exercise'],
      isRepeatable: true,
      cooldownHours: 24,
    };

    it('validates a valid quest', () => {
      const result = questSchema.safeParse(validQuest);
      expect(result.success).toBe(true);
    });

    it('requires title', () => {
      const questWithoutTitle = { ...validQuest };
      delete (questWithoutTitle as any).title;
      
      const result = questSchema.safeParse(questWithoutTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('enforces title length limit', () => {
      const longTitle = 'a'.repeat(101);
      const questWithLongTitle = { ...validQuest, title: longTitle };
      
      const result = questSchema.safeParse(questWithLongTitle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title must be 100 characters or less');
      }
    });

    it('enforces description length limit', () => {
      const longDescription = 'a'.repeat(501);
      const questWithLongDescription = { ...validQuest, description: longDescription };
      
      const result = questSchema.safeParse(questWithLongDescription);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be 500 characters or less');
      }
    });

    it('validates category enum values', () => {
      const invalidCategory = { ...validQuest, category: 'invalid' };
      
      const result = questSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid category');
      }
    });

    it('validates difficulty enum values', () => {
      const invalidDifficulty = { ...validQuest, difficulty: 'invalid' };
      
      const result = questSchema.safeParse(invalidDifficulty);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid difficulty');
      }
    });

    it('enforces XP range', () => {
      const negativeXP = { ...validQuest, xp: -10 };
      const tooHighXP = { ...validQuest, xp: 15000 };
      
      expect(questSchema.safeParse(negativeXP).success).toBe(false);
      expect(questSchema.safeParse(tooHighXP).success).toBe(false);
    });

    it('enforces gold range', () => {
      const negativeGold = { ...validQuest, gold: -5 };
      const tooHighGold = { ...validQuest, gold: 15000 };
      
      expect(questSchema.safeParse(negativeGold).success).toBe(false);
      expect(questSchema.safeParse(tooHighGold).success).toBe(false);
    });

    it('allows optional fields to be undefined', () => {
      const questWithoutOptionals = {
        title: 'Test Quest',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
      };
      
      const result = questSchema.safeParse(questWithoutOptionals);
      expect(result.success).toBe(true);
    });

    it('accepts valid tags array', () => {
      const questWithTags = { ...validQuest, tags: ['tag1', 'tag2', 'tag3'] };
      const result = questSchema.safeParse(questWithTags);
      expect(result.success).toBe(true);
    });
  });

  describe('Challenge Schema', () => {
    const validChallenge = {
      name: 'Test Challenge',
      description: 'A test challenge description',
      category: 'strength',
      difficulty: 'medium',
      xp: 100,
      gold: 50,
      target: 10,
      unit: 'reps',
      frequency: 'daily',
    };

    it('validates a valid challenge', () => {
      const result = challengeSchema.safeParse(validChallenge);
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const challengeWithoutName = { ...validChallenge };
      delete (challengeWithoutName as any).name;
      
      const result = challengeSchema.safeParse(challengeWithoutName);
      expect(result.success).toBe(false);
    });

    it('enforces name length limit', () => {
      const longName = 'a'.repeat(101);
      const challengeWithLongName = { ...validChallenge, name: longName };
      
      const result = challengeSchema.safeParse(challengeWithLongName);
      expect(result.success).toBe(false);
    });

    it('validates category enum values', () => {
      const invalidCategory = { ...validChallenge, category: 'invalid' };
      
      const result = challengeSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('enforces target minimum value', () => {
      const invalidTarget = { ...validChallenge, target: 0 };
      
      const result = challengeSchema.safeParse(invalidTarget);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Target must be at least 1');
      }
    });

    it('validates frequency enum values', () => {
      const invalidFrequency = { ...validChallenge, frequency: 'invalid' };
      
      const result = challengeSchema.safeParse(invalidFrequency);
      expect(result.success).toBe(false);
    });
  });

  describe('User Schema', () => {
    const validUser = {
      id: 'user-123',
      email: 'test@example.com',
      preferences: { theme: 'dark' },
    };

    it('validates a valid user', () => {
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('requires id', () => {
      const userWithoutId = { ...validUser };
      delete (userWithoutId as any).id;
      
      const result = userSchema.safeParse(userWithoutId);
      expect(result.success).toBe(false);
    });

    it('validates email format', () => {
      const invalidEmail = { ...validUser, email: 'invalid-email' };
      
      const result = userSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('allows email to be optional', () => {
      const userWithoutEmail = { ...validUser };
      delete (userWithoutEmail as any).email;
      
      const result = userSchema.safeParse(userWithoutEmail);
      expect(result.success).toBe(true);
    });
  });

  describe('Quest Completion Schema', () => {
    const validCompletion = {
      questId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-123',
      completed: true,
      completedAt: '2024-01-01T00:00:00.000Z',
      xpEarned: 50,
      goldEarned: 25,
      notes: 'Completed successfully',
    };

    it('validates a valid quest completion', () => {
      const result = questCompletionSchema.safeParse(validCompletion);
      expect(result.success).toBe(true);
    });

    it('requires questId', () => {
      const completionWithoutQuestId = { ...validCompletion };
      delete (completionWithoutQuestId as any).questId;
      
      const result = questCompletionSchema.safeParse(completionWithoutQuestId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('validates UUID format for questId', () => {
      const invalidUUID = { ...validCompletion, questId: 'invalid-uuid' };
      
      const result = questCompletionSchema.safeParse(invalidUUID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid quest ID');
      }
    });

    it('enforces non-negative XP and gold', () => {
      const negativeXP = { ...validCompletion, xpEarned: -10 };
      const negativeGold = { ...validCompletion, goldEarned: -5 };
      
      expect(questCompletionSchema.safeParse(negativeXP).success).toBe(false);
      expect(questCompletionSchema.safeParse(negativeGold).success).toBe(false);
    });

    it('enforces notes length limit', () => {
      const longNotes = 'a'.repeat(501);
      const completionWithLongNotes = { ...validCompletion, notes: longNotes };
      
      const result = questCompletionSchema.safeParse(completionWithLongNotes);
      expect(result.success).toBe(false);
    });
  });

  describe('Quest Form Schema', () => {
    const validQuestForm = {
      title: 'Test Quest',
      description: 'A test quest description',
      category: 'might',
      difficulty: 'easy',
      xp: 50,
      gold: 25,
      tags: ['test'],
      isRepeatable: true,
      cooldownHours: 24,
    };

    it('validates quest form data', () => {
      const result = questFormSchema.safeParse(validQuestForm);
      expect(result.success).toBe(true);
    });

    it('excludes id field', () => {
      const formWithId = { ...validQuestForm, id: 'quest-123' };
      
      const result = questFormSchema.safeParse(formWithId);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });
  });

  describe('Quest Filters Schema', () => {
    const validFilters = {
      category: 'might',
      difficulty: 'easy',
      completed: false,
      search: 'exercise',
      tags: ['strength', 'cardio'],
    };

    it('validates quest filters', () => {
      const result = questFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('allows partial filters', () => {
      const partialFilters = { category: 'might' };
      const result = questFiltersSchema.safeParse(partialFilters);
      expect(result.success).toBe(true);
    });

    it('allows empty filters', () => {
      const emptyFilters = {};
      const result = questFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
    });
  });

  describe('Date Range Schema', () => {
    it('validates valid date range', () => {
      const validRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      
      const result = dateRangeSchema.safeParse(validRange);
      expect(result.success).toBe(true);
    });

    it('validates same start and end date', () => {
      const sameDate = {
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      };
      
      const result = dateRangeSchema.safeParse(sameDate);
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const invalidFormat = {
        startDate: '2024/01/01',
        endDate: '2024/01/31',
      };
      
      const result = dateRangeSchema.safeParse(invalidFormat);
      expect(result.success).toBe(false);
    });

    it('rejects end date before start date', () => {
      const invalidRange = {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      };
      
      const result = dateRangeSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Start date must be before or equal to end date');
        expect(result.error.issues[0].path).toEqual(['endDate']);
      }
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateSchema', () => {
      it('returns success result for valid data', () => {
        const validQuest = {
          title: 'Test Quest',
          category: 'might',
          difficulty: 'easy',
          xp: 50,
          gold: 25,
        };
        
        const result = validateSchema(questSchema, validQuest);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validQuest);
        }
      });

      it('returns error result for invalid data', () => {
        const invalidQuest = {
          title: '',
          category: 'invalid',
          difficulty: 'easy',
          xp: 50,
          gold: 25,
        };
        
        const result = validateSchema(questSchema, invalidQuest);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toBeInstanceOf(Error);
        }
      });
    });

    describe('safeParse', () => {
      it('returns parsed data for valid input', () => {
        const validQuest = {
          title: 'Test Quest',
          category: 'might',
          difficulty: 'easy',
          xp: 50,
          gold: 25,
        };
        
        const result = safeParse(questSchema, validQuest);
        expect(result).toEqual(validQuest);
      });

      it('returns null for invalid input', () => {
        const invalidQuest = {
          title: '',
          category: 'invalid',
          difficulty: 'easy',
          xp: 50,
          gold: 25,
        };
        
        const result = safeParse(questSchema, invalidQuest);
        expect(result).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings appropriately', () => {
      const emptyTitle = {
        title: '',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
      };
      
      const result = questSchema.safeParse(emptyTitle);
      expect(result.success).toBe(false);
    });

    it('handles null values appropriately', () => {
      const nullValues = {
        title: 'Test Quest',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
        tags: null,
      };
      
      const result = questSchema.safeParse(nullValues);
      expect(result.success).toBe(false);
    });

    it('handles undefined values appropriately', () => {
      const undefinedValues = {
        title: 'Test Quest',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
        tags: undefined,
      };
      
      const result = questSchema.safeParse(undefinedValues);
      expect(result.success).toBe(true);
    });

    it('handles very large numbers', () => {
      const largeNumbers = {
        title: 'Test Quest',
        category: 'might',
        difficulty: 'easy',
        xp: Number.MAX_SAFE_INTEGER,
        gold: Number.MAX_SAFE_INTEGER,
      };
      
      const result = questSchema.safeParse(largeNumbers);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Composition', () => {
    it('allows extending base schemas', () => {
      const extendedQuestSchema = questSchema.extend({
        customField: questSchema.shape.title.optional(),
      });
      
      const validExtendedQuest = {
        title: 'Test Quest',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
        customField: 'Custom Title',
      };
      
      const result = extendedQuestSchema.safeParse(validExtendedQuest);
      expect(result.success).toBe(true);
    });

    it('maintains validation rules when extending', () => {
      const extendedQuestSchema = questSchema.extend({
        customField: questSchema.shape.title.optional(),
      });
      
      const invalidExtendedQuest = {
        title: '',
        category: 'might',
        difficulty: 'easy',
        xp: 50,
        gold: 25,
        customField: 'Custom Title',
      };
      
      const result = extendedQuestSchema.safeParse(invalidExtendedQuest);
      expect(result.success).toBe(false);
    });
  });
});
