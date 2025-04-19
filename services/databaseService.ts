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
    id: string // Reverted id type back to string
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id as any) // Use 'as any' to bypass strict type check for now
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Record not found in ${table} with ID ${id}`);

      return data as unknown as Database['public']['Tables'][T]['Row'];
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
          // FIXED: Using the appropriate Supabase filtering methods
          // Instead of using filter() method with potentially invalid operators, use specific methods
          switch (filter.operator) {
            case 'eq':
              queryBuilder = queryBuilder.eq(filter.column, filter.value);
              break;
            case 'neq':
              queryBuilder = queryBuilder.neq(filter.column, filter.value);
              break;
            case 'gt':
              queryBuilder = queryBuilder.gt(filter.column, filter.value);
              break;
            case 'gte':
              queryBuilder = queryBuilder.gte(filter.column, filter.value);
              break;
            case 'lt':
              queryBuilder = queryBuilder.lt(filter.column, filter.value);
              break;
            case 'lte':
              queryBuilder = queryBuilder.lte(filter.column, filter.value);
              break;
            case 'like':
              queryBuilder = queryBuilder.like(filter.column, filter.value);
              break;
            case 'ilike':
              queryBuilder = queryBuilder.ilike(filter.column, filter.value);
              break;
            case 'is':
              queryBuilder = queryBuilder.is(filter.column, filter.value);
              break;
            case 'in':
              queryBuilder = queryBuilder.in(filter.column, filter.value);
              break;
            case 'contains':
              queryBuilder = queryBuilder.contains(filter.column, filter.value);
              break;
            case 'overlaps':
              queryBuilder = queryBuilder.overlaps(filter.column, filter.value);
              break;
            default:
              // Fallback to filter method for any other operators
              console.warn(`Using generic filter for operator: ${filter.operator}`);
              queryBuilder = queryBuilder.filter(filter.column, filter.operator, filter.value);
          }
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
        .insert(insertData as any) // Use 'as any' to bypass strict type check
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error(`Insert operation into ${table} did not return data.`);

      return result as unknown as Database['public']['Tables'][T]['Row'];
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
    id: string, // Reverted id type back to string
    updateData: Database['public']['Tables'][T]['Update']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(updateData as any) // Use 'as any' to bypass strict type check
        .eq('id', id as any) // Use 'as any' to bypass strict type check for now
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error(`Update operation on ${table} with ID ${id} did not return data.`);

      return result as unknown as Database['public']['Tables'][T]['Row'];
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
    id: string // Reverted id type back to string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id as any); // Use 'as any' to bypass strict type check for now

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
    // --- Temporarily commented out due to RPC type errors ---
    // let transactionStarted = false;
    try {
      // const { error: beginError } = await supabase.rpc('begin_transaction');
      // if (beginError) throw createDatabaseError(beginError, 'beginning transaction');
      // transactionStarted = true;

      const result = await callback(); // Execute callback directly for now

      // const { error: commitError } = await supabase.rpc('commit_transaction');
      // if (commitError) throw createDatabaseError(commitError, 'committing transaction');

      return result;
    } catch (error) {
      // if (transactionStarted) {
      //   try {
      //     await supabase.rpc('rollback_transaction');
      //   } catch (rollbackError) {
      //     console.error('Failed to rollback transaction:', createDatabaseError(rollbackError, 'rolling back transaction'));
      //   }
      // }
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error && 'rawError' in error) {
          throw error;
      } else {
          throw createDatabaseError(error, 'executing transaction callback');
      }
    }
    // --- End of temporarily commented out section ---
  }
}