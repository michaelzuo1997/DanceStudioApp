import { supabase } from './supabase';

export async function fetchMerchandise({ category, isActive = true } = {}) {
  let query = supabase
    .from('merchandise')
    .select('*')
    .order('sort_order', { ascending: true });

  if (isActive !== null) {
    query = query.eq('is_active', isActive);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[merchandiseService] fetch failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchMerchandiseById(id) {
  const { data, error } = await supabase
    .from('merchandise')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[merchandiseService] fetchById failed:', error.message);
    return null;
  }
  return data;
}
