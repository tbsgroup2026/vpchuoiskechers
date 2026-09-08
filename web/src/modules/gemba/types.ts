/**
 * Gemba.Pro Module TypeScript Definitions — Updated with Strict State Machine Workflow
 */

export type GembaStatus = 'NEW' | 'PROCESSING' | 'WAITING_CONFIRMATION' | 'COMPLETED';

export interface GembaRecord {
  id: string;
  code: string;
  title: string;
  description?: string;
  category_id: string;
  category_name?: string;
  category_code?: string;
  priority: 'CAO' | 'TRUNG_BINH' | 'THAP';
  status: GembaStatus;
  is_overdue?: boolean;
  factory_id: string;
  factory_name?: string;
  workshop_id: string;
  workshop_name?: string;
  line_id: string;
  line_name?: string;
  team_id: string;
  team_name?: string;
  created_by_emp_code: string;
  created_by_name?: string;
  assigned_to_emp_code?: string;
  assigned_to_name?: string;
  assigned_group?: string;
  due_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at?: string;
  history?: GembaHistory[];
  attachments?: GembaAttachment[];
}

export interface GembaHistory {
  id: string;
  record_id: string;
  action_type: 'CREATE' | 'ASSIGN' | 'ACCEPT' | 'SUBMIT_CONFIRMATION' | 'APPROVE' | 'REJECT';
  old_status?: string;
  new_status?: string;
  note?: string;
  performed_by: string;
  performed_by_name?: string;
  created_at: string;
}

export interface GembaAttachment {
  id: string;
  record_id: string;
  r2_object_key: string;
  url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: string;
  created_at: string;
}

export interface GembaTreeNode {
  id: string;
  name: string;
  code: string;
  openCount?: number;
  overdueCount?: number;
  teams?: GembaTreeNode[];
  lines?: GembaTreeNode[];
  workshops?: GembaTreeNode[];
}

export interface GembaUserScope {
  id: string;
  emp_code: string;
  name?: string;
  email?: string;
  title?: string;
  department?: string;
  role_code?: string;
  factory_id?: string;
  workshop_id?: string;
  line_id?: string;
  team_id?: string;
  factory_name?: string;
  workshop_name?: string;
  line_name?: string;
  team_name?: string;
  gemba_role: string;
  mmtb_token?: string;
  status?: string;
}

export interface GembaDashboardKPIs {
  total: number;
  new: number;
  processing: number;
  waiting_confirmation: number;
  completed: number;
  overdue: number;
  this_month: number;
}
