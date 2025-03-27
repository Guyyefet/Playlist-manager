import { prismaClient, type Prisma } from '$db/index';
import { handleDbError, createWhereClause } from '$db/utils';
import type { Token } from './types';

async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prismaClient.$transaction(callback);
}

export async function saveToken(userId: string, token: Token): Promise<void> {
  try {
    console.log('Saving token for user:', userId);
    await withTransaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: userId },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token || '',
          tokenExpiry: new Date(token.expiry_date)
        }
      });
      
    if (!result) {
        throw new Error(`Failed to save token for user ${userId}. No rows were updated. Check if user exists and has valid ID.`);
    }
      
      console.log('Token saved successfully for user:', userId);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in saveToken:', {
      error: errorMessage,
      userId
    });
    handleDbError(error);
    throw new Error(`Database error in saveToken: ${errorMessage}`);
  }
}

export async function getToken(userId: string): Promise<Token | null> {
  try {
    console.log('Getting token for user:', userId);
    const user = await prismaClient.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('No user found with ID:', userId);
      return null;
    }

    console.log('Successfully retrieved token for user:', userId);
    return {
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
      expiry_date: user.tokenExpiry.getTime(),
      email: user.email,
      expires_in: 3600, // Default value
      scope: 'https://www.googleapis.com/auth/youtube.readonly email profile openid',
      token_type: 'Bearer'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getToken:', {
      error: errorMessage,
      userId
    });
    handleDbError(error);
    throw new Error(`Database error in getToken: ${errorMessage}`);
  }
}

export async function createUser(token: Token) {
  if (!token.email) {
    throw new Error('Failed to get user email from token');
  }

  try {
    const user = await withTransaction(async (tx) => {
      return tx.user.create({
        data: {
          email: token.email,
          accessToken: token.access_token,
          refreshToken: token.refresh_token || '',
          tokenExpiry: new Date(token.expiry_date),
          name: token.email.split('@')[0] // Add default name
        }
      });
    });

    if (!user) {
        throw new Error(`Database error: Failed to create user with email ${token.email}. Possible duplicate email or database constraint violation.`);
    }

    if (!user.id) {
        throw new Error(`Database error: User created (email: ${token.email}) but missing ID. Check database auto-increment or UUID generation.`);
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', {
      error: error instanceof Error ? error.message : String(error),
      token: {
        email: token.email,
        accessToken: !!token.access_token,
        refreshToken: !!token.refresh_token,
        expiryDate: token.expiry_date
      }
    });
    handleDbError(error);
    throw error;
  }
}

export async function getUser(params: Partial<{ id: string, email: string }>) {
  try {
    // Use createWhereClause with proper type casting
    const whereClause = createWhereClause<{ id: string; email: string }>(params);
    
    console.log('Looking up user with params:', params);
    const user = await prismaClient.user.findFirst({
      where: whereClause
    });
    
    console.log('User lookup result:', user ? `Found user with ID ${user.id}` : 'No user found');
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getUser:', {
      error: errorMessage,
      params
    });
    handleDbError(error);
    throw new Error(`Database error in getUser: ${errorMessage}`);
  }
}

export async function updateUserToken(userId: string, token: Token) {
  try {
    console.log('Updating token for user:', userId);
    const user = await withTransaction(async (tx) => {
      return tx.user.update({
        where: { id: userId },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token || '',
          tokenExpiry: new Date(token.expiry_date)
        }
      });
    });
    
    if (!user) {
        throw new Error(`Failed to update token for user ${userId}. User may not exist or database constraints may prevent update.`);
    }
    
    console.log('Token updated successfully for user:', userId);
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updateUserToken:', {
      error: errorMessage,
      userId
    });
    handleDbError(error);
    throw new Error(`Database error in updateUserToken: ${errorMessage}`);
  }
}

export async function deleteToken(userId: string) {
  try {
    console.log('Deleting token for user:', userId);
    const user = await withTransaction(async (tx) => {
      return tx.user.update({
        where: { id: userId },
        data: {
          accessToken: '',
          refreshToken: '',
          tokenExpiry: new Date(0) // Set to Unix epoch
        }
      });
    });
    
    if (!user) {
        throw new Error(`Failed to delete token for user ${userId}. User may not exist or token fields may already be cleared.`);
    }
    
    console.log('Token deleted successfully for user:', userId);
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deleteToken:', {
      error: errorMessage,
      userId
    });
    handleDbError(error);
    throw new Error(`Database error in deleteToken: ${errorMessage}`);
  }
}
