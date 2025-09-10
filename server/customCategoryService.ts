import { db } from './storage';
import { customCategories, customQuestions, categoryRatings } from '../shared/schema';
import { CustomCategory, CustomQuestion, CategoryRating } from '../shared/schema';
import { eq, desc, and, avg, count } from 'drizzle-orm';

export class CustomCategoryService {
  async createCategory(
    name: string,
    description: string = '',
    createdBy: string,
    isPublic: boolean = false
  ): Promise<CustomCategory | null> {
    try {
      const [result] = await db.insert(customCategories)
        .values({
          name,
          description,
          createdBy,
          isPublic,
          createdAt: new Date(),
          questionCount: 0,
          plays: 0,
          rating: 0
        })
        .returning();

      return {
        id: result.id,
        name: result.name,
        description: result.description || undefined,
        createdBy: result.createdBy,
        createdAt: result.createdAt!,
        isPublic: result.isPublic || false,
        questionCount: result.questionCount || 0,
        plays: result.plays || 0,
        rating: result.rating || 0,
        questions: []
      };
    } catch (error) {
      console.error('Error creating custom category:', error);
      return null;
    }
  }

  async addQuestion(
    categoryId: number,
    question: string,
    options: string[],
    correctAnswer: number,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    explanation?: string
  ): Promise<CustomQuestion | null> {
    try {
      if (options.length !== 4) {
        throw new Error('Must provide exactly 4 options');
      }

      if (correctAnswer < 0 || correctAnswer > 3) {
        throw new Error('Correct answer index must be between 0 and 3');
      }

      const [result] = await db.insert(customQuestions)
        .values({
          categoryId,
          question,
          option1: options[0],
          option2: options[1],
          option3: options[2],
          option4: options[3],
          correctAnswer,
          difficulty,
          explanation,
          createdAt: new Date()
        })
        .returning();

      // Update question count for the category
      await db.update(customCategories)
        .set({ 
          questionCount: (await this.getCategoryQuestionCount(categoryId))
        })
        .where(eq(customCategories.id, categoryId));

      return {
        id: result.id,
        categoryId: result.categoryId,
        question: result.question,
        options: [result.option1, result.option2, result.option3, result.option4],
        correctAnswer: result.correctAnswer,
        difficulty: result.difficulty as 'easy' | 'medium' | 'hard',
        explanation: result.explanation || undefined
      };
    } catch (error) {
      console.error('Error adding question to custom category:', error);
      return null;
    }
  }

  async getCategory(categoryId: number, includeQuestions: boolean = false): Promise<CustomCategory | null> {
    try {
      const [category] = await db.select().from(customCategories)
        .where(eq(customCategories.id, categoryId));

      if (!category) return null;

      let questions: CustomQuestion[] = [];
      if (includeQuestions) {
        const questionResults = await db.select().from(customQuestions)
          .where(eq(customQuestions.categoryId, categoryId));

        questions = questionResults.map((q: any) => ({
          id: q.id,
          categoryId: q.categoryId,
          question: q.question,
          options: [q.option1, q.option2, q.option3, q.option4],
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          explanation: q.explanation || undefined
        }));
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdBy: category.createdBy,
        createdAt: category.createdAt!,
        isPublic: category.isPublic || false,
        questionCount: category.questionCount || 0,
        plays: category.plays || 0,
        rating: category.rating || 0,
        questions
      };
    } catch (error) {
      console.error('Error getting custom category:', error);
      return null;
    }
  }

  async getPublicCategories(limit: number = 20): Promise<CustomCategory[]> {
    try {
      const results = await db.select().from(customCategories)
        .where(eq(customCategories.isPublic, true))
        .orderBy(desc(customCategories.plays), desc(customCategories.rating))
        .limit(limit);

      return results.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdBy: category.createdBy,
        createdAt: category.createdAt,
        isPublic: category.isPublic || false,
        questionCount: category.questionCount || 0,
        plays: category.plays || 0,
        rating: category.rating || 0,
        questions: []
      }));
    } catch (error) {
      console.error('Error getting public categories:', error);
      return [];
    }
  }

  async getUserCategories(userId: string): Promise<CustomCategory[]> {
    try {
      const results = await db.select().from(customCategories)
        .where(eq(customCategories.createdBy, userId))
        .orderBy(desc(customCategories.createdAt));

      return results.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdBy: category.createdBy,
        createdAt: category.createdAt,
        isPublic: category.isPublic || false,
        questionCount: category.questionCount || 0,
        plays: category.plays || 0,
        rating: category.rating || 0,
        questions: []
      }));
    } catch (error) {
      console.error('Error getting user categories:', error);
      return [];
    }
  }

  async updateCategory(
    categoryId: number,
    userId: string,
    updates: Partial<{ name: string; description: string; isPublic: boolean }>
  ): Promise<boolean> {
    try {
      // Verify user owns the category
      const [category] = await db.select().from(customCategories)
        .where(and(
          eq(customCategories.id, categoryId),
          eq(customCategories.createdBy, userId)
        ));

      if (!category) return false;

      await db.update(customCategories)
        .set(updates)
        .where(eq(customCategories.id, categoryId));

      return true;
    } catch (error) {
      console.error('Error updating custom category:', error);
      return false;
    }
  }

  async deleteCategory(categoryId: number, userId: string): Promise<boolean> {
    try {
      // Verify user owns the category
      const [category] = await db.select().from(customCategories)
        .where(and(
          eq(customCategories.id, categoryId),
          eq(customCategories.createdBy, userId)
        ));

      if (!category) return false;

      // Delete all questions first
      await db.delete(customQuestions)
        .where(eq(customQuestions.categoryId, categoryId));

      // Delete all ratings
      await db.delete(categoryRatings)
        .where(eq(categoryRatings.categoryId, categoryId));

      // Delete the category
      await db.delete(customCategories)
        .where(eq(customCategories.id, categoryId));

      return true;
    } catch (error) {
      console.error('Error deleting custom category:', error);
      return false;
    }
  }

  async rateCategory(
    categoryId: number,
    playerId: string,
    rating: number,
    review?: string
  ): Promise<boolean> {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user already rated this category
      const existing = await db.select().from(categoryRatings)
        .where(and(
          eq(categoryRatings.categoryId, categoryId),
          eq(categoryRatings.playerId, playerId)
        ));

      if (existing.length > 0) {
        // Update existing rating
        await db.update(categoryRatings)
          .set({ rating, review, createdAt: new Date() })
          .where(and(
            eq(categoryRatings.categoryId, categoryId),
            eq(categoryRatings.playerId, playerId)
          ));
      } else {
        // Create new rating
        await db.insert(categoryRatings)
          .values({
            categoryId,
            playerId,
            rating,
            review,
            createdAt: new Date()
          });
      }

      // Update category average rating
      await this.updateCategoryRating(categoryId);

      return true;
    } catch (error) {
      console.error('Error rating category:', error);
      return false;
    }
  }

  async incrementCategoryPlays(categoryId: number): Promise<void> {
    try {
      await db.update(customCategories)
        .set({ plays: (await this.getCategoryPlays(categoryId)) + 1 })
        .where(eq(customCategories.id, categoryId));
    } catch (error) {
      console.error('Error incrementing category plays:', error);
    }
  }

  async searchCategories(searchTerm: string, isPublicOnly: boolean = true): Promise<CustomCategory[]> {
    try {
      const query = db.select().from(customCategories);
      
      // This is a simplified search - in a real app you'd use proper full-text search
      const results = await (isPublicOnly ? 
        query.where(eq(customCategories.isPublic, true)) : 
        query);

      // Filter results by search term (simplified approach)
      const filteredResults = results.filter((category: any) => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredResults.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdBy: category.createdBy,
        createdAt: category.createdAt,
        isPublic: category.isPublic || false,
        questionCount: category.questionCount || 0,
        plays: category.plays || 0,
        rating: category.rating || 0,
        questions: []
      }));
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }

  private async updateCategoryRating(categoryId: number): Promise<void> {
    try {
      const ratings = await db.select().from(categoryRatings)
        .where(eq(categoryRatings.categoryId, categoryId));

      if (ratings.length === 0) return;

      const averageRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length;
      
      await db.update(customCategories)
        .set({ rating: Math.round(averageRating * 10) / 10 }) // Round to 1 decimal
        .where(eq(customCategories.id, categoryId));
    } catch (error) {
      console.error('Error updating category rating:', error);
    }
  }

  private async getCategoryQuestionCount(categoryId: number): Promise<number> {
    try {
      const questions = await db.select().from(customQuestions)
        .where(eq(customQuestions.categoryId, categoryId));
      return questions.length;
    } catch (error) {
      console.error('Error getting category question count:', error);
      return 0;
    }
  }

  private async getCategoryPlays(categoryId: number): Promise<number> {
    try {
      const [category] = await db.select().from(customCategories)
        .where(eq(customCategories.id, categoryId));
      return category?.plays || 0;
    } catch (error) {
      console.error('Error getting category plays:', error);
      return 0;
    }
  }
}