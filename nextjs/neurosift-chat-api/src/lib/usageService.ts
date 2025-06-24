import { connectDB } from './mongodb';
import { DailyUsage } from '../models/DailyUsage';

// Daily limits for each model (in USD)
const DAILY_LIMITS = {
  'anthropic/claude-sonnet-4': 5,
  'openai/gpt-4.1': 5.00,
  'openai/gpt-4.1-mini': 5.00,
} as const;

type ModelName = keyof typeof DAILY_LIMITS;
type UsageType = 'public' | 'userKey';

interface UsageStatus {
  model: string;
  dailyLimit: number;
  currentUsage: number;
  available: boolean;
  remainingBudget: number;
}

export class UsageService {
  private static getTodayString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  static async getCurrentUsage(model: ModelName, usageType: UsageType): Promise<number> {
    await connectDB();

    const today = this.getTodayString();
    const usage = await DailyUsage.findOne({
      date: today,
      model,
      usageType
    });

    return usage?.totalCost || 0;
  }

  static async getRemainingBudget(model: ModelName): Promise<number> {
    const currentUsage = await this.getCurrentUsage(model, "public");
    const limit = DAILY_LIMITS[model];
    return limit - currentUsage;
  }

  static async updateUsage(
    model: ModelName,
    usageType: UsageType,
    cost: number
  ): Promise<void> {
    await connectDB();

    const today = this.getTodayString();

    console.info('Updating usage:', { date: today, model, usageType, cost });

    await DailyUsage.findOneAndUpdate(
      {
        date: today,
        model,
        usageType
      },
      {
        $inc: {
          totalCost: cost,
          requestCount: 1
        },
        $set: {
          lastUpdated: Date.now()
        }
      },
      {
        upsert: true,
        new: true
      }
    );
  }

  static async isModelAvailable(model: ModelName, usageType: UsageType): Promise<boolean> {
    const currentUsage = await this.getCurrentUsage(model, usageType);
    const limit = DAILY_LIMITS[model];

    // Allow if usage is not yet negative (can go over once)
    return currentUsage >= 0 || currentUsage < limit;
  }

  static async canMakeRequest(model: ModelName, usageType: UsageType): Promise<boolean> {
    const remaining = await this.getRemainingBudget(model);

    return remaining > 0;
  }

  static async getAllUsageStatus(): Promise<UsageStatus[]> {
    const models = Object.keys(DAILY_LIMITS) as ModelName[];
    const results: UsageStatus[] = [];

    for (const model of models) {
      const publicUsage = await this.getCurrentUsage(model, 'public');
      const limit = DAILY_LIMITS[model];

      results.push({
        model,
        dailyLimit: limit,
        currentUsage: publicUsage,
        available: publicUsage < limit,
        remainingBudget: limit - publicUsage
      });
    }

    return results;
  }

  static getDailyLimit(model: string): number | null {
    return DAILY_LIMITS[model as ModelName] || null;
  }

  static isTrackedModel(model: string): model is ModelName {
    return model in DAILY_LIMITS;
  }
}
