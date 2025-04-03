import { supabase } from '../utils/supabase';
// Assuming Database type is correctly defined and exported from ../types/database
import { Database } from '../types/database';
import { PostgrestError } from '@supabase/supabase-js';

// --- Local Type Definitions (Removed - Using Global Types Now) ---
// Local TableNames, GetRowType, GetInsertType, GetUpdateType removed.

// Define DatabaseError structure
export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
  rawError?: unknown;
}

// Define Filter structure
export interface Filter {
  column: string;
  operator: string;
  value: any;
}

// Define OrderBy structure
export interface OrderBy {
  column: string;
  direction: 'asc' | 'desc';
}

// Define QueryOptions structure
export interface QueryOptions {
  filters?: Filter[];
  orderBy?: OrderBy;
  limit?: number;
  offset?: number;
}

// Define PaginatedResult structure
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

// --- Conditional Helper Types (Removed - Using Global Types Directly) ---


// --- Helper Function for Error Creation ---

function createDatabaseError(error: unknown, context: string): DatabaseError {
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    return {
      code: pgError.code || 'UNKNOWN_DB_ERROR',
      message: pgError.message || `Failed ${context}`,
      details: pgError.details || 'No details provided.',
      hint: pgError.hint || 'No hint provided.',
      rawError: error,
    };
  }
  if (error instanceof Error) {
    return {
      code: 'CLIENT_ERROR',
      message: error.message || `Failed ${context}`,
      details: error.stack || 'No stack trace available.',
      hint: 'Check application code or network.',
      rawError: error,
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: `An unknown error occurred while ${context}`,
    details: String(error),
    hint: 'Unknown error source.',
    rawError: error,
  };
}


// --- DatabaseService Class ---

export class DatabaseService {
  /**
   * Generic fetch function for getting a single record by ID.
   * Throws DatabaseError on failure or if record not found.
   */
  static async getById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Record not found in ${table} with ID ${id}`);

      // Cast needed as Supabase client might return a more specific type than Record<string, any>
      // Cast should align with the specific table's Row type
      return data as unknown as Database['public']['Tables'][T]['Row']; // Cast via unknown
    } catch (error) {
      throw createDatabaseError(error, `fetching ${table} by ID ${id}`);
    }
  }

  /**
   * Generic fetch function with pagination and filtering.
   * Throws DatabaseError on failure.
   */
  static async query<T extends keyof Database['public']['Tables']>(
    table: T,
    options?: QueryOptions
  ): Promise<PaginatedResult<Database['public']['Tables'][T]['Row']>> {
    try {
      let queryBuilder = supabase.from(table).select('*', { count: 'exact' });

      if (options?.filters) {
        options.filters.forEach((filter: Filter) => {
          queryBuilder = queryBuilder.filter(filter.column, filter.operator, filter.value);
        });
      }

      if (options?.orderBy) {
        queryBuilder = queryBuilder.order(options.orderBy.column, {
          ascending: options.orderBy.direction === 'asc'
        });
      }

      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      const totalCount = count || 0;
      const returnedData = (data || []) as unknown as Database['public']['Tables'][T]['Row'][]; // Cast via unknown

      return {
        data: returnedData,
        count: totalCount,
        hasMore: totalCount > offset + returnedData.length
      };
    } catch (error) {
      throw createDatabaseError(error, `querying ${table}`);
    }
  }

  /**
   * Generic insert function.
   * Throws DatabaseError on failure.
   */
  static async insert<T extends keyof Database['public']['Tables']>(
    table: T,
    insertData: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(insertData) // Use direct type, Supabase client should handle it
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error(`Insert operation into ${table} did not return data.`);

      return result as unknown as Database['public']['Tables'][T]['Row']; // Cast via unknown
    } catch (error) {
      throw createDatabaseError(error, `inserting into ${table}`);
    }
  }

  /**
   * Generic update function.
   * Throws DatabaseError on failure.
   */
  static async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    updateData: Database['public']['Tables'][T]['Update']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updateData) // Use direct type, Supabase client should handle it
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error(`Update operation on ${table} with ID ${id} did not return data.`);

      return result as unknown as Database['public']['Tables'][T]['Row']; // Cast via unknown
    } catch (error) {
      throw createDatabaseError(error, `updating ${table} with ID ${id}`);
    }
  }

  /**
   * Generic delete function.
   * Throws DatabaseError on failure.
   */
  static async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw createDatabaseError(error, `deleting from ${table} with ID ${id}`);
    }
  }

  /**
   * Function to handle/format database errors (exported for potential external use).
   */
  static handleError(error: unknown): DatabaseError {
      return createDatabaseError(error, 'processing database operation');
  }

  /**
   * Execute a callback function within a database transaction using Supabase RPC.
   * Throws DatabaseError on failure.
   */
  static async transaction<T>(
    callback: () => Promise<T>
  ): Promise<T> {
    let transactionStarted = false;
    try {
      const { error: beginError } = await supabase.rpc('begin_transaction');
      if (beginError) throw createDatabaseError(beginError, 'beginning transaction');
      transactionStarted = true;

      const result = await callback();

      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw createDatabaseError(commitError, 'committing transaction');

      return result;
    } catch (error) {
      if (transactionStarted) {
        try {
          await supabase.rpc('rollback_transaction');
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', createDatabaseError(rollbackError, 'rolling back transaction'));
        }
      }
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'rawError' in error) {
          throw error;
      } else {
          throw createDatabaseError(error, 'executing transaction callback');
      }
    }
  }
}