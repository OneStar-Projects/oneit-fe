import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Modal, message, Tag, Progress, Select, Transfer, Form } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Component, HostAgent } from '../types';
import { getHostAgents, deleteHostAgents, deployAgents, getDeployStatus } from '../services';
import { getManagedHosts } from '@/services/hosts';
import { IManagedHost } from '@/types/hosts';

const { Option } = Select;

interface DeploymentManagementProps {
  component: Component;
}

const DeploymentManagement: React.FC<DeploymentManagementProps> = ({ component }) => {
  const { t } = useTranslation('builtInComponents');
  const [hostAgents, setHostAgents] = useState<HostAgent[]>([]);
  const [hosts, setHosts] = useState<IManagedHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedHosts, setSelectedHosts] = useState<number[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployTaskId, setDeployTaskId] = useState<string>('');
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployStatus, setDeployStatus] = useState<'pending' | 'running' | 'success' | 'failed'>('pending');

  useEffect(() => {
    fetchHostAgents();
    fetchHosts();
  }, [component.id]);

  useEffect(() => {
    if (deployTaskId && deployStatus === 'running') {
      const interval = setInterval(() => {
        checkDeployStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [deployTaskId, deployStatus]);

  const fetchHostAgents = async () => {
    try {
      setLoading(true);
      const response = await getHostAgents({
        component_id: component.id,
        limit: 100,
        offset: 0,
      });
      setHostAgents(response.list);
    } catch (error: any) {
      console.error('Failed to fetch host agents:', error);
      // 检查是否是API不存在的情况
      if (error?.message?.includes('Unexpected token')) {
        message.warning(t('Host agents API is not available yet. This feature is under development.'));
        setHostAgents([]);
      } else {
        message.error(t('Failed to fetch host agents'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await getManagedHosts({
        limit: 1000,
        offset: 0,
        query: '',
      });
      setHosts(response.list);
    } catch (error: any) {
      console.error('Failed to fetch hosts:', error);
      if (error?.message?.includes('Unexpected token')) {
        message.warning(t('Managed hosts API is not available yet. This feature is under development.'));
        setHosts([]);
      } else {
        message.error(t('Failed to fetch hosts'));
      }
    }
  };

  const checkDeployStatus = async () => {
    try {
      const task = await getDeployStatus(deployTaskId);
      setDeployProgress(task.progress);
      setDeployStatus(task.status as 'pending' | 'running' | 'success' | 'failed');
      
      if (task.status === 'success' || task.status === 'failed') {
        message.info(task.message);
        fetchHostAgents(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Failed to check deploy status:', error);
      if (error?.message?.includes('Unexpected token')) {
        message.warning(t('Deploy status API is not available yet. This feature is under development.'));
        setDeployStatus('failed');
      }
    }
  };

  const handleDeploy = async () => {
    if (selectedHosts.length === 0) {
      message.warning(t('Please select at least one host'));
      return;
    }

    try {
      setDeploying(true);
      const response = await deployAgents({
        host_ids: selectedHosts,
        component_id: component.id,
        version_id: 0, // 需要添加版本ID参数
      });
      setDeployTaskId(response.task_id);
      setDeployStatus('running');
      setDeployProgress(0);
      setDeployModalVisible(false);
      message.success(t('Deployment started successfully'));
    } catch (error: any) {
      console.error('Failed to start deployment:', error);
      if (error?.message?.includes('Unexpected token')) {
        message.warning(t('Deploy API is not available yet. This feature is under development.'));
      } else {
        message.error(t('Failed to start deployment'));
      }
    } finally {
      setDeploying(false);
    }
  };

  const handleDeleteHostAgent = (id: number) => {
    Modal.confirm({
      title: t('Delete Host Agent'),
      content: t('Are you sure you want to delete this host agent?'),
      onOk: async () => {
        try {
          await deleteHostAgents([id]);
          message.success(t('Host agent deleted successfully'));
          fetchHostAgents();
        } catch (error: any) {
          console.error('Failed to delete host agent:', error);
          if (error?.message?.includes('Unexpected token')) {
            message.warning(t('Delete host agent API is not available yet. This feature is under development.'));
          } else {
            message.error(t('Failed to delete host agent'));
          }
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'deploying':
        return 'blue';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: t('Host'),
      dataIndex: 'host_id',
      key: 'host_id',
      render: (hostId: number) => {
        const host = hosts.find(h => h.id === hostId);
        return host ? `${host.host_ident} (${host.ssh_ip})` : hostId;
      },
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {t(status)}
        </Tag>
      ),
    },
    {
      title: t('Deployed At'),
      dataIndex: 'deployed_at',
      key: 'deployed_at',
      render: (timestamp: number) => timestamp ? new Date(timestamp * 1000).toLocaleString() : '-',
    },
    {
      title: t('Last Heartbeat'),
      dataIndex: 'last_heartbeat',
      key: 'last_heartbeat',
      render: (timestamp: number) => timestamp ? new Date(timestamp * 1000).toLocaleString() : '-',
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record: HostAgent) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: t('Host Agent Details'),
                content: (
                  <div>
                    <p><strong>{t('Config Data')}:</strong></p>
                    <pre>{record.config_data || '-'}</pre>
                    {record.error_message && (
                      <>
                        <p><strong>{t('Error Message')}:</strong></p>
                        <pre style={{ color: 'red' }}>{record.error_message}</pre>
                      </>
                    )}
                  </div>
                ),
                width: 600,
              });
            }}
          >
            {t('View')}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteHostAgent(record.id)}
          >
            {t('Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t('Deployment Management')}
      extra={
        <Space>
          {deployStatus === 'running' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Progress percent={deployProgress} size="small" />
              <span>{t('Deploying...')}</span>
            </div>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchHostAgents}
            loading={loading}
          >
            {t('Refresh')}
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setDeployModalVisible(true)}
          >
            {t('Deploy to Hosts')}
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={hostAgents}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={t('Deploy to Hosts')}
        visible={deployModalVisible}
        onOk={handleDeploy}
        onCancel={() => setDeployModalVisible(false)}
        confirmLoading={deploying}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item
            label={t('Select Hosts')}
            required
          >
            <Select
              mode="multiple"
              placeholder={t('Please select hosts to deploy')}
              value={selectedHosts}
              onChange={setSelectedHosts}
              style={{ width: '100%' }}
            >
              {hosts.map(host => (
                <Option key={host.id} value={host.id}>
                  {host.host_ident} ({host.ssh_ip})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <p style={{ color: '#666' }}>
            {t('Selected hosts will be deployed with the current agent configuration.')}
          </p>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeploymentManagement;
