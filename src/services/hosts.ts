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
import { IManagedHost, IManagedHostQuery, IManagedHostResponse } from '@/types/hosts';

// 获取受管主机列表
export const getManagedHosts = async (params: IManagedHostQuery): Promise<IManagedHostResponse> => {
  const res = await request(`/api/n9e/managed-hosts`, {
    params,
  });
  return {
    list: res?.dat?.list || [],
    total: res?.dat?.total || 0,
  };
};

// 获取单个受管主机详情
export const getManagedHost = async (id: number): Promise<IManagedHost> => {
  const res = await request(`/api/n9e/managed-hosts/${id}`);
  return res?.dat;
};

// 创建受管主机
export const createManagedHost = async (data: IManagedHost[]): Promise<any> => {
  return request(`/api/n9e/managed-hosts`, {
    method: 'POST',
    data,
  });
};

// 更新受管主机
export const updateManagedHost = async (id: number, data: Partial<IManagedHost>): Promise<any> => {
  return request(`/api/n9e/managed-hosts/${id}`, {
    method: 'PUT',
    data,
  });
};

// 删除受管主机
export const deleteManagedHosts = async (ids: number[]): Promise<any> => {
  return request(`/api/n9e/managed-hosts`, {
    method: 'DELETE',
    data: {
      ids,
    },
  });
};

// 批量导入受管主机
export const importManagedHosts = async (file: File): Promise<any[]> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // 这里需要根据实际的 API 调整
  // 假设 API 返回一个包含成功和失败列表的对象
  const res = await request(`/api/n9e/managed-hosts/import`, {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res?.dat?.results || [];
};

// 测试SSH连接
export const testSSHConnection = async (data: Partial<IManagedHost>): Promise<any> => {
  return request(`/api/n9e/managed-hosts/test-ssh`, {
    method: 'POST',
    data,
  });
};