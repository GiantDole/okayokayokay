import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  base_url: string;
  well_known_url: string;
  well_known_data: any | null;
  payment_address: string | null;
  price_per_request: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceRequest {
  id: string;
  resource_id: string;
  request_path: string;
  request_params: any | null;
  request_headers: any | null;
  response_data: any | null;
  response_status: number | null;
  tx_hash: string | null;
  payment_amount: string | null;
  payment_to_address: string | null;
  nonce: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Get all active resources
 */
export async function getActiveResources() {
  return supabase
    .from('resources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
}

/**
 * Get a resource by ID
 */
export async function getResourceById(id: string) {
  return supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();
}

/**
 * Get a resource by base URL
 */
export async function getResourceByUrl(baseUrl: string) {
  return supabase
    .from('resources')
    .select('*')
    .eq('base_url', baseUrl)
    .single();
}

/**
 * Create a new resource
 */
export async function createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
  return supabase
    .from('resources')
    .insert(resource)
    .select()
    .single();
}

/**
 * Update resource well-known data
 */
export async function updateResourceWellKnown(id: string, wellKnownData: any) {
  return supabase
    .from('resources')
    .update({
      well_known_data: wellKnownData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

/**
 * Create a resource request log
 */
export async function createResourceRequest(request: Omit<ResourceRequest, 'id' | 'created_at' | 'completed_at'>) {
  return supabase
    .from('resource_requests')
    .insert(request)
    .select()
    .single();
}

/**
 * Update a resource request
 */
export async function updateResourceRequest(id: string, updates: Partial<ResourceRequest>) {
  return supabase
    .from('resource_requests')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : undefined,
    })
    .eq('id', id);
}

/**
 * Get resource requests by resource ID
 */
export async function getResourceRequests(resourceId: string, limit = 100) {
  return supabase
    .from('resource_requests')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Get recent resource requests across all resources
 */
export async function getRecentResourceRequests(limit = 50) {
  return supabase
    .from('resource_requests')
    .select(`
      *,
      resources (
        name,
        base_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
}
