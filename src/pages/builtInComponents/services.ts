/*
 * Copyright 2022 Nightingale Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import _ from 'lodash';
import request from '@/utils/request';
import { RequestMethod } from '@/store/common';
import { Component, ComponentPost, ComponentPut, PayloadQuery, TypeEnum, Payload, PayloadPost, PayloadPut } from './types';

export type { Component, TypeEnum, Payload };

export const getComponents = function (params = {}): Promise<Component[]> {
  return request('/api/n9e/builtin-components', {
    method: RequestMethod.Get,
    params,
  }).then((res) => {
    return res.dat;
  });
};

export const getCates = function (params: { component_id: number; type: TypeEnum }): Promise<string[]> {
  return request('/api/n9e/builtin-payloads/cates', {
    method: RequestMethod.Get,
    params,
  }).then((res) => {
    return res.dat;
  });
};

export const getPayloads = <T>(params: PayloadQuery): Promise<T> => {
  return request('/api/n9e/builtin-payloads', {
    method: RequestMethod.Get,
    params,
  }).then((res) => {
    return res.dat;
  });
};

export const getPayload = (id: number): Promise<{ content: string }> => {
  return request(`/api/n9e/builtin-payload/${id}`, {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat;
  });
};

export const getPayloadByUUID = (uuid: number): Promise<{ content: string }> => {
  return request(`/api/n9e/builtin-payload`, {
    method: RequestMethod.Get,
    params: { uuid },
  }).then((res) => {
    return res.dat;
  });
};

export const postPayloads = (data: PayloadPost[]): Promise<any> => {
  return request('/api/n9e/builtin-payloads', {
    method: RequestMethod.Post,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const putPayload = (data: PayloadPut): Promise<any> => {
  return request('/api/n9e/builtin-payloads', {
    method: RequestMethod.Put,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const deletePayloads = (ids: number[]): Promise<any> => {
  return request('/api/n9e/builtin-payloads', {
    method: RequestMethod.Delete,
    data: { ids },
  }).then((res) => {
    return res.dat;
  });
};

export const postComponents = (data: ComponentPost[]): Promise<any> => {
  return request('/api/n9e/builtin-components', {
    method: RequestMethod.Post,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const putComponent = (data: ComponentPut): Promise<any> => {
  return request('/api/n9e/builtin-components', {
    method: RequestMethod.Put,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const deleteComponents = (ids: number[]): Promise<any> => {
  return request('/api/n9e/builtin-components', {
    method: RequestMethod.Delete,
    data: { ids },
  }).then((res) => {
    return res.dat;
  });
};

// HostAgent related APIs
export const getHostAgents = function (params: HostAgentQuery): Promise<HostAgentResponse> {
  return request('/api/n9e/host-agents', {
    method: RequestMethod.Get,
    params,
  }).then((res) => {
    return res.dat;
  });
};

export const createHostAgent = function (data: Partial<HostAgent>): Promise<any> {
  return request('/api/n9e/host-agents', {
    method: RequestMethod.Post,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const updateHostAgent = function (id: number, data: Partial<HostAgent>): Promise<any> {
  return request(`/api/n9e/host-agents/${id}`, {
    method: RequestMethod.Put,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const deleteHostAgents = function (ids: number[]): Promise<any> {
  return request('/api/n9e/host-agents', {
    method: RequestMethod.Delete,
    data: { ids },
  }).then((res) => {
    return res.dat;
  });
};

// Agent binary upload API
export const uploadAgentBinary = function (
  file: File, 
  componentId: number, 
  onProgress?: (progress: number) => void
): Promise<{ download_url: string; version: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('component_id', componentId.toString());

  return request('/api/n9e/builtin-components/upload-agent', {
    method: RequestMethod.Post,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  }).then((res) => {
    return res.dat;
  });
};

// Agent version management APIs
export const getAgentVersions = function (componentId: number): Promise<AgentVersion[]> {
  return request(`/api/n9e/agent-versions/component/${componentId}`, {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat;
  });
};

export const getActiveAgentVersion = function (componentId: number): Promise<AgentVersion | null> {
  return request(`/api/n9e/agent-versions/component/${componentId}/active`, {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat;
  });
};

export const createAgentVersion = function (data: Partial<AgentVersion>): Promise<any> {
  return request('/api/n9e/agent-versions', {
    method: RequestMethod.Post,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const updateAgentVersion = function (versionId: number, data: Partial<AgentVersion>): Promise<any> {
  return request(`/api/n9e/agent-versions/version/${versionId}`, {
    method: RequestMethod.Put,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const deleteAgentVersion = function (versionId: number): Promise<any> {
  return request(`/api/n9e/agent-versions/version/${versionId}`, {
    method: RequestMethod.Delete,
  }).then((res) => {
    return res.dat;
  });
};

export const activateAgentVersion = function (componentId: number, versionId: number): Promise<any> {
  return request(`/api/n9e/agent-versions/component/${componentId}/activate/${versionId}`, {
    method: RequestMethod.Post,
  }).then((res) => {
    return res.dat;
  });
};

// Agent deployment APIs
export const getAgentDeployments = function (params: {
  host_id?: number;
  component_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ list: AgentDeployment[]; total: number }> {
  return request('/api/n9e/agent-deployments', {
    method: RequestMethod.Get,
    params,
  }).then((res) => {
    return res.dat;
  });
};

export const getAgentDeployment = function (deploymentId: number): Promise<AgentDeployment> {
  return request(`/api/n9e/agent-deployments/${deploymentId}`, {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat;
  });
};

export const deployAgents = function (data: {
  host_ids: number[];
  component_id: number;
  version_id: number;
  config_data?: any;
}): Promise<{ task_id: string }> {
  return request('/api/n9e/agent-deployments/deploy', {
    method: RequestMethod.Post,
    data,
  }).then((res) => {
    return res.dat;
  });
};

export const getDeployStatus = function (taskId: string): Promise<{
  task_id: string;
  status: string;
  progress: number;
  message: string;
  results: Record<number, {
    host_id: number;
    status: string;
    message: string;
    deployed_at: number;
  }>;
  create_at: number;
  update_at: number;
}> {
  return request(`/api/n9e/agent-deployments/status/${taskId}`, {
    method: RequestMethod.Get,
  }).then((res) => {
    return res.dat;
  });
};
