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
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import _ from 'lodash';
import MockAdapter from 'axios-mock-adapter';

import { CommonStateContext } from '@/App';
import ManagedHosts from '@/pages/hosts';
import request from '@/utils/request';

const mock = new MockAdapter(request);

const mockCommonState = {
  datasourceCateOptions: [],
  groupedDatasourceList: {},
  reloadGroupedDatasourceList: async () => {},
  datasourceList: [],
  setDatasourceList: () => {},
  reloadDatasourceList: async () => {},
  busiGroups: [],
  setBusiGroups: () => {},
  curBusiId: 0,
  setCurBusiId: () => {},
  businessGroup: {},
  setBusiGroup: () => {},
  getVaildBusinessGroup: () => {},
  businessGroupOnChange: () => {},
  profile: {
    admin: true,
    nickname: 'admin',
    role: 'Admin',
    roles: ['Admin'],
    username: 'admin',
    email: 'admin@example.com',
    phone: '12345678901',
    id: 1,
    portrait: '',
    contacts: {},
  },
  setProfile: () => {},
  licenseExpired: false,
  versions: {
    version: '',
    github_verison: '',
    newVersion: false,
  },
  isPlus: false,
  sideMenuBgMode: 'theme',
  setSideMenuBgMode: () => {},
  darkMode: false,
  setDarkMode: () => {},
  esIndexMode: 'all',
  dashboardSaveMode: 'manual',
  perms: ['/targets', '/managed-hosts'],
  screenTemplates: [],
  installTs: 0,
};

describe('ManagedHosts', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('should render managed hosts page', async () => {
    mock.onGet('/api/n9e/managed-hosts').reply(200, {
      dat: {
        list: [
          {
            target_ident: 'host1',
            target: {
              host_ip: '192.168.1.10',
            },
            ssh_ip: '192.168.1.10',
            ssh_port: 22,
            ssh_user: 'root',
            auth_method: 'key',
            credential: '***',
            note: 'Test host',
            status: 'active',
            sudo_required: true,
            create_at: 1678886400,
            update_at: 1678886400,
          },
        ],
        total: 1,
      },
    });

    render(
      <CommonStateContext.Provider value={mockCommonState}>
        <ConfigProvider>
          <Router>
            <ManagedHosts />
          </Router>
        </ConfigProvider>
      </CommonStateContext.Provider>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('host1')).toBeInTheDocument();
    });

    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('key')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Test host')).toBeInTheDocument();
  });
});