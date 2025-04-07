import type { Prisma } from '$db/index';
import { handleError } from '$lib/server/youtube/utils/helpers';

export abstract class BaseRepository<T> {
  protected tx: Prisma.TransactionClient;

  constructor(tx: Prisma.TransactionClient) {
    this.tx = tx;
  }

  protected abstract getModel(): any;

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const model = this.getModel();
      return await model.create({ data });
    } catch (error) {
      throw handleError(error, 'Failed to create record');
    }
  }

  async read(id: string): Promise<T | null> {
    try {
      const model = this.getModel();
      return await model.findUnique({ where: { id } });
    } catch (error) {
      throw handleError(error, 'Failed to read record');
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const model = this.getModel();
      return await model.update({ 
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw handleError(error, 'Failed to update record');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const model = this.getModel();
      await model.delete({ where: { id } });
    } catch (error) {
      throw handleError(error, 'Failed to delete record');
    }
  }
}
