import { supabase } from '../utils/supabase';
import { Database, DatabaseError, QueryOptions, PaginatedResult, TableNames } from '../types/database';

export class DatabaseService {
  /**
   * Generic fetch function for getting a single record by ID
   */
  static async getById<T extends TableNames>(
    table: T,
    id: string
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ${table} by ID:`, error);
      return null;
    }
  }

  /**
   * Generic fetch function with pagination and filtering
   */
  static async query<T extends TableNames>(
    table: T,
    options?: QueryOptions
  ): Promise<PaginatedResult<Database['public']['Tables'][T]['Row']>> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact' });

      // Apply filters if provided
      if (options?.filters) {
        options.filters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.direction === 'asc'
        });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.range(
          options.offset || 0,
          (options.offset || 0) + options.limit - 1
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        hasMore: count ? (options?.offset || 0) + (options?.limit || 0) < count : false
      };
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      return {
        data: [],
        count: 0,
        hasMore: false
      };
    }
  }

  /**
   * Generic insert function
   */
  static async insert<T extends TableNames>(
    table: T,
    data: Omit<Database['public']['Tables'][T]['Row'], 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables'][T]['Row'], 'id'>>
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return null;
    }
  }

  /**
   * Generic update function
   */
  static async update<T extends TableNames>(
    table: T,
    id: string,
    data: Partial<Omit<Database['public']['Tables'][T]['Row'], 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  }

  /**
   * Generic delete function
   */
  static async delete<T extends TableNames>(
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
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  }

  /**
   * Function to handle database errors
   */
  static handleError(error: unknown): DatabaseError {
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      const { code, message, details, hint } = error as any;
      return {
        code: code || 'UNKNOWN_ERROR',
        message: message || 'An unknown error occurred',
        details,
        hint
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error
    };
  }

  /**
   * Execute a function within a transaction
   */
  static async transaction<T>(
    callback: () => Promise<T>
  ): Promise<T | null> {
    try {
      const { data, error } = await supabase.rpc('begin_transaction');
      if (error) throw error;

      const result = await callback();

      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      await supabase.rpc('rollback_transaction');
      return null;
    }
  }
}