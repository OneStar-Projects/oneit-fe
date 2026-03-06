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
import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { IManagedHost } from '@/types/hosts';
import { getManagedHost, testSSHConnection } from '@/services/hosts';

interface IProps {
  hosts: IManagedHost[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onTableChange: (page: number, pageSize?: number) => void;
  onEdit: (host: IManagedHost) => void;
  onDelete: (id: number) => void;
  selectedRowKeys: React.Key[];
  onSelectionChange: (selectedRowKeys: React.Key[]) => void;
}

const ManagedHostsTable: React.FC<IProps> = ({
  hosts,
  loading,
  pagination,
  onTableChange,
  onEdit,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}) => {
  const { t } = useTranslation('hosts');
  const [isTestModalVisible, setIsTestModalVisible] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string>('');
  const [testingHost, setTestingHost] = useState<IManagedHost | null>(null);

  const handleTestConnection = async (host: IManagedHost) => {
    setIsTestModalVisible(true);
    setTestingHost(host);
    setTestResult('Testing SSH connection...');
    try {
      const result = await testSSHConnection({
        ssh_ip: host.ssh_ip,
        ssh_port: host.ssh_port,
        ssh_user: host.ssh_user,
        auth_method: host.auth_method,
        credential_ref: host.credential_ref,
      });
      setTestResult(result.message || 'Connection successful');
    } catch (error) {
      console.error('Failed to test connection:', error);
      setTestResult('Connection failed: ' + (error as any).message);
    }
  };

  const handleDeployAgent = (host: IManagedHost) => {
    Modal.confirm({
      title: t('Deploy Agent'),
      content: t('Are you sure you want to deploy the agent to this host?'),
      onOk: async () => {
        try {
          // 这里需要调用实际的部署 Agent API
          message.success(t('Agent deployment started'));
        } catch (error) {
          console.error('Failed to deploy agent:', error);
          message.error(t('Failed to deploy agent'));
        }
      },
    });
  };

  const columns = [
    {
      title: t('Host Ident'),
      dataIndex: 'host_ident',
      key: 'host_ident',
    },
    {
      title: t('SSH IP'),
      dataIndex: 'ssh_ip',
      key: 'ssh_ip',
    },
    {
      title: t('SSH Port'),
      dataIndex: 'ssh_port',
      key: 'ssh_port',
      render: (ssh_port: number) => ssh_port || 22,
    },
    {
      title: t('SSH User'),
      dataIndex: 'ssh_user',
      key: 'ssh_user',
    },
    {
      title: t('Auth Method'),
      dataIndex: 'auth_method',
      key: 'auth_method',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'active') {
          color = 'success';
        } else if (status === 'failed') {
          color = 'error';
        } else if (status === 'pending') {
          color = 'processing';
        } else if (status === 'disabled') {
          color = 'default';
        }
        return <Tag color={color}>{t(status)}</Tag>;
      },
    },
    {
      title: t('Note'),
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: t('Create At'),
      dataIndex: 'create_at',
      key: 'create_at',
      render: (create_at: number) => new Date(create_at * 1000).toLocaleString(),
    },
    {
      title: t('Update At'),
      dataIndex: 'update_at',
      key: 'update_at',
      render: (update_at: number) => new Date(update_at * 1000).toLocaleString(),
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_: any, record: IManagedHost) => (
        <Space size='middle'>
          <Button type='link' icon={<EditOutlined />} onClick={() => onEdit(record)}>
            {t('Edit')}
          </Button>
          <Button type='link' icon={<DeleteOutlined />} onClick={() => onDelete(record.id)}>
            {t('Delete')}
          </Button>
          <Button type='link' icon={<PlayCircleOutlined />} onClick={() => handleTestConnection(record)}>
            {t('Test SSH')}
          </Button>
          <Button type='link' onClick={() => handleDeployAgent(record)}>
            {t('Deploy Agent')}
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      onSelectionChange(selectedRowKeys);
    },
  };

  return (
    <>
      <Table
        rowKey='id'
        dataSource={hosts}
        columns={columns}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: onTableChange,
        }}
        rowSelection={rowSelection}
      />
      <Modal
        title={t('Test SSH Connection')}
        open={isTestModalVisible}
        onOk={() => setIsTestModalVisible(false)}
        onCancel={() => setIsTestModalVisible(false)}
      >
        {testingHost && (
          <div>
            <p><strong>{t('Host')}:</strong> {testingHost.host_ident} ({testingHost.ssh_ip})</p>
            <p><strong>{t('Result')}:</strong> {testResult}</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ManagedHostsTable;