export interface Component {
  id: number;
  ident: string;
  logo: string;
  readme: string;
  disabled: 0 | 1;
  // Agent deployment related fields
  agent_type?: string;
  agent_version?: string;
  agent_binary_url?: string;
  ansible_script?: string;
  config_template?: string;
  extra_vars?: string;
}

export type ComponentPost = Omit<Component, 'id'>;
export type ComponentPut = Component;

export enum TypeEnum {
  alert = 'alert',
  dashboard = 'dashboard',
  collect = 'collect',
  metric = 'metric',
}
export interface PayloadQuery {
  component_id: number;
  type: TypeEnum;
  cate?: string; // 某些组件有子分类
  query?: string; // 名称模糊查询
}

export interface Payload {
  id: number;
  uuid: number;
  type: TypeEnum;
  component_id: number;
  cate: string;
  name: string;
  content: string;
}

export type PayloadPost = Omit<Payload, 'id'>;
export type PayloadPut = Payload;

export interface HostAgent {
  id: number;
  host_id: number;
  component_id: number;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  config_data?: string;
  deployed_at: number;
  last_heartbeat: number;
  error_message?: string;
  create_at: number;
  update_at: number;
  create_by: string;
  update_by: string;
}

export interface HostAgentQuery {
  host_id?: number;
  component_id?: number;
  status?: string;
  limit: number;
  offset: number;
}

export interface HostAgentResponse {
  list: HostAgent[];
  total: number;
}

export interface DeployTask {
  task_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  message: string;
  create_at: number;
  update_at: number;
}

// Agent Version Management Types
export interface AgentVersion {
  id: number;
  component_id: number;
  version: string;
  agent_type?: string;
  binary_url: string;
  binary_hash: string;
  binary_size: number;
  config_template: string;
  ansible_script: string;
  extra_vars: string;
  release_notes: string;
  is_active: boolean;
  create_at: number;
  create_by: string;
}

export interface AgentVersionPost {
  component_id: number;
  version: string;
  agent_type?: string;
  binary_url: string;
  config_template?: string;
  ansible_script?: string;
  extra_vars?: string;
  release_notes?: string;
  is_active?: boolean;
}

export interface AgentVersionPut extends Partial<AgentVersion> {
  id: number;
}

// Agent Deployment Types
export interface AgentDeployment {
  id: number;
  host_id: number;
  component_id: number;
  version_id: number;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  config_data: string;
  deployed_at: number;
  last_heartbeat: number;
  error_message?: string;
  create_at: number;
  create_by: string;
  update_at: number;
  update_by: string;
  
  // Related objects
  host?: ManagedHost;
  component?: Component;
  version?: AgentVersion;
}

export interface ManagedHost {
  id: number;
  host_ident: string;
  ssh_ip: string;
  ssh_port: number;
  ssh_user: string;
  auth_method: 'key' | 'password';
  credential_ref: string;
  status: 'pending' | 'active' | 'failed' | 'disabled';
  note: string;
  sudo_required: boolean;
  create_at: number;
  update_at: number;
  create_by: string;
  update_by: string;
}

export interface AgentDeployRequest {
  host_ids: number[];
  component_id: number;
  version_id: number;
  config_data?: Record<string, any>;
}

export interface AgentDeployResult {
  task_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'partial_success';
  progress: number;
  message: string;
  results: Record<number, AgentDeployStatus>;
  create_at: number;
  update_at: number;
}

export interface AgentDeployStatus {
  host_id: number;
  status: 'pending' | 'deploying' | 'success' | 'failed';
  message: string;
  deployed_at: number;
}
