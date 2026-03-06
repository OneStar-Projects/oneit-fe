import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Modal, Upload, Select, Table, Tag, Tooltip, Popconfirm, Progress, Descriptions, Divider, Alert, Switch } from 'antd';
import { UploadOutlined, SaveOutlined, CloudUploadOutlined, DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Component, AgentVersion } from '../types';
import { putComponent, uploadAgentBinary, getAgentVersions, getActiveAgentVersion, createAgentVersion, updateAgentVersion, activateAgentVersion, deleteAgentVersion } from '../services';

const { TextArea } = Input;
const { Option } = Select;

interface AgentManagementProps {
  component: Component;
  onUpdate: () => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({ component, onUpdate }) => {
  const { t } = useTranslation('builtInComponents');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<AgentVersion | null>(null);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AgentVersion | null>(null);
  const [versionForm] = Form.useForm();
  const [versionDetailVisible, setVersionDetailVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AgentVersion | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();
  const [editingConfigVersion, setEditingConfigVersion] = useState<AgentVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [component]);

  const loadVersions = async () => {
    try {
      const [versionsData, activeVersionData] = await Promise.all([
        getAgentVersions(component.id),
        getActiveAgentVersion(component.id)
      ]);
      setVersions(versionsData);
      setActiveVersion(activeVersionData);
    } catch (error) {
      console.error('Failed to load versions:', error);
      message.error(t('Failed to load versions'));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      setUploadProgress(0);

      // 验证文件类型
      const allowedTypes = ['.tar.gz', '.zip', '.bin', '.exe'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.some(type => file.name.toLowerCase().endsWith(type))) {
        message.error(t('Unsupported file type. Please upload .tar.gz, .zip, .bin, or .exe files.'));
        return false;
      }

      // 验证文件大小 (100MB限制)
      if (file.size > 100 * 1024 * 1024) {
        message.error(t('File size exceeds 100MB limit.'));
        return false;
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 上传文件
      const response = await uploadAgentBinary(file, component.id, (progress) => {
        setUploadProgress(progress);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 更新表单中的URL和版本
      versionForm.setFieldsValue({
        binary_url: response.download_url,
        version: response.version || `v${Date.now()}`,
      });

      message.success(t('Agent binary uploaded successfully'));
      
      // 延迟重置进度条
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

      return false; // 阻止默认上传行为
    } catch (error) {
      console.error('Failed to upload agent binary:', error);
      message.error(t('Failed to upload agent binary'));
      setUploadProgress(0);
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateVersion = () => {
    setEditingVersion(null);
    versionForm.resetFields();
    // 设置默认值：如果是第一个版本，自动设置为激活状态
    const isFirstVersion = versions.length === 0;
    versionForm.setFieldsValue({
      agent_type: component.agent_type || 'categraf',
    });
    setVersionModalVisible(true);
  };

  const handleEditVersion = (version: AgentVersion) => {
    setEditingVersion(version);
    versionForm.setFieldsValue({
      version: version.version,
      binary_url: version.binary_url,
      release_notes: version.release_notes,
      agent_type: version.agent_type || component.agent_type || 'categraf',
    });
    setVersionModalVisible(true);
  };

  const handleEditConfig = (version: AgentVersion) => {
    setEditingConfigVersion(version);
    configForm.setFieldsValue({
      config_template: version.config_template,
      ansible_script: version.ansible_script,
      extra_vars: version.extra_vars,
    });
    setConfigModalVisible(true);
  };

  const handleViewVersion = (version: AgentVersion) => {
    setSelectedVersion(version);
    setVersionDetailVisible(true);
  };

  const handleSaveVersion = async () => {
    try {
      const values = await versionForm.validateFields();
      
      if (editingVersion) {
        // 更新版本
        await updateAgentVersion(editingVersion.id, values);
        message.success(t('Version updated successfully'));
      } else {
        // 创建新版本
        const isFirstVersion = versions.length === 0;
        await createAgentVersion({
          ...values,
          component_id: component.id,
          is_active: isFirstVersion, // 第一个版本自动激活
        });
        message.success(t('Version created successfully'));
      }
      
      setVersionModalVisible(false);
      loadVersions();
    } catch (error) {
      console.error('Failed to save version:', error);
      message.error(t('Failed to save version'));
    }
  };

  const handleToggleActive = async (version: AgentVersion, checked: boolean) => {
    try {
      if (checked) {
        // 激活当前版本，同时将其他版本设置为未激活
        await activateAgentVersion(component.id, version.id);
        message.success(t('Version activated successfully'));
      } else {
        // 如果当前版本是唯一激活的版本，不允许取消激活
        const activeVersions = versions.filter(v => v.is_active);
        if (activeVersions.length === 1 && activeVersions[0].id === version.id) {
          message.warning(t('Cannot deactivate the only active version. Please activate another version first.'));
          return;
        }
        
        // 设置为未激活状态
        await updateAgentVersion(version.id, { is_active: false });
        message.success(t('Version deactivated successfully'));
      }
      loadVersions();
    } catch (error) {
      console.error('Failed to toggle version status:', error);
      message.error(t('Failed to toggle version status'));
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await configForm.validateFields();
      
      if (editingConfigVersion) {
        // 更新配置
        await updateAgentVersion(editingConfigVersion.id, values);
        message.success(t('Configuration updated successfully'));
        setConfigModalVisible(false);
        loadVersions();
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      message.error(t('Failed to save configuration'));
    }
  };

  const handleActivateVersion = async (versionId: number) => {
    try {
      await activateAgentVersion(component.id, versionId);
      message.success(t('Version activated successfully'));
      loadVersions();
    } catch (error) {
      console.error('Failed to activate version:', error);
      message.error(t('Failed to activate version'));
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    try {
      await deleteAgentVersion(versionId);
      message.success(t('Version deleted successfully'));
      loadVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      message.error(t('Failed to delete version'));
    }
  };

  const uploadProps = {
    beforeUpload: handleFileUpload,
    showUploadList: false,
    accept: '.tar.gz,.zip,.bin,.exe',
    disabled: uploadLoading,
  };

  const versionColumns = [
    {
      title: t('Version'),
      dataIndex: 'version',
      key: 'version',
      render: (version: string, record: AgentVersion) => (
        <Space>
          <span style={{ fontWeight: 'bold' }}>{version}</span>
          {record.is_active && <Tag color="green">{t('Active')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('Agent Type'),
      dataIndex: 'agent_type',
      key: 'agent_type',
      render: (agentType: string) => agentType || '-',
    },
    {
      title: t('Binary Size'),
      dataIndex: 'binary_size',
      key: 'binary_size',
      render: (size: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-',
    },
    {
      title: t('Active'),
      key: 'active',
      render: (_, record: AgentVersion) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren={t('Active')}
          unCheckedChildren={t('Inactive')}
        />
      ),
    },
    {
      title: t('Created'),
      dataIndex: 'create_at',
      key: 'create_at',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: t('Created By'),
      dataIndex: 'create_by',
      key: 'create_by',
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record: AgentVersion) => (
        <Space>
          <Tooltip title={t('View Details')}>
            <Button 
              type="link" 
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewVersion(record)}
            />
          </Tooltip>
          <Tooltip title={t('Edit Configuration')}>
            <Button 
              type="link" 
              icon={<SettingOutlined />}
              onClick={() => handleEditConfig(record)}
            />
          </Tooltip>
          <Tooltip title={t('Edit Version')}>
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => handleEditVersion(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('Are you sure to delete this version?')}
            onConfirm={() => handleDeleteVersion(record.id)}
          >
            <Tooltip title={t('Delete Version')}>
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
                disabled={record.is_active}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card title={t('Agent Management')}>
        {/* 版本管理区域 */}
        <Card 
          title={t('Version Management')} 
          size="small"
          type="inner"
        >
          {activeVersion && (
            <Alert
              message={t('Active Version')}
              description={
                <div>
                  <strong>{activeVersion.version}</strong> - {activeVersion.release_notes || t('No release notes')}
                  <br />
                  <small>{t('Created by')}: {activeVersion.create_by} | {t('Created at')}: {new Date(activeVersion.create_at * 1000).toLocaleString()}</small>
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateVersion}
            >
              {t('Create New Version')}
            </Button>
          </div>
          
          <Table 
            columns={versionColumns} 
            dataSource={versions}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: t('No versions found. Create your first version.'),
            }}
          />
        </Card>
      </Card>

      {/* 版本管理模态框 */}
      <Modal
        title={editingVersion ? t('Edit Version') : t('Create New Version')}
        visible={versionModalVisible}
        onOk={handleSaveVersion}
        onCancel={() => setVersionModalVisible(false)}
        width={800}
        okText={t('Save')}
        cancelText={t('Cancel')}
      >
        <Form form={versionForm} layout="vertical">
          <Form.Item
            label={t('Agent Type')}
            name="agent_type"
            rules={[{ required: true, message: t('Please select agent type') }]}
          >
            <Select>
              <Option value="categraf">Categraf</Option>
              <Option value="telegraf">Telegraf</Option>
              <Option value="node_exporter">Node Exporter</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('Version')}
            name="version"
            rules={[{ required: true, message: t('Please input version') }]}
          >
            <Input placeholder="e.g., v1.0.0" />
          </Form.Item>

          <Form.Item
            label={t('Agent Binary')}
            name="binary_url"
            rules={[{ required: true, message: t('Please upload agent binary or input download URL') }]}
          >
            <div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload {...uploadProps}>
                  <Button 
                    icon={<CloudUploadOutlined />} 
                    loading={uploadLoading}
                    disabled={uploadLoading}
                  >
                    {t('Upload Agent Binary')}
                  </Button>
                </Upload>
                
                {uploadProgress > 0 && (
                  <Progress 
                    percent={uploadProgress} 
                    status={uploadProgress === 100 ? 'success' : 'active'}
                    size="small"
                  />
                )}

                <Input 
                  placeholder="Or input download URL directly"
                  addonAfter={
                    <Button 
                      type="link" 
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const url = versionForm.getFieldValue('binary_url');
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      {t('Download')}
                    </Button>
                  }
                />
              </Space>
            </div>
          </Form.Item>

          <Form.Item
            label={t('Release Notes')}
            name="release_notes"
          >
            <TextArea rows={4} placeholder="Release notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置编辑模态框 */}
      <Modal
        title={t('Edit Configuration')}
        visible={configModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => setConfigModalVisible(false)}
        width={800}
        okText={t('Save')}
        cancelText={t('Cancel')}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            label={t('Config Template')}
            name="config_template"
          >
            <TextArea rows={4} placeholder="Configuration template content..." />
          </Form.Item>

          <Form.Item
            label={t('Ansible Script')}
            name="ansible_script"
          >
            <TextArea rows={4} placeholder="Ansible deployment script..." />
          </Form.Item>

          <Form.Item
            label={t('Extra Variables')}
            name="extra_vars"
          >
            <TextArea rows={3} placeholder='{"key": "value"} in JSON format' />
          </Form.Item>
        </Form>
      </Modal>

      {/* 版本详情模态框 */}
      <Modal
        title={t('Version Details')}
        visible={versionDetailVisible}
        onCancel={() => setVersionDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVersionDetailVisible(false)}>
            {t('Close')}
          </Button>
        ]}
        width={800}
      >
        {selectedVersion && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('Version')}>
              <Space>
                <span>{selectedVersion.version}</span>
                {selectedVersion.is_active && <Tag color="green">{t('Active')}</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('Agent Type')}>
              {selectedVersion.agent_type || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Binary URL')}>
              <a href={selectedVersion.binary_url} target="_blank" rel="noopener noreferrer">
                {selectedVersion.binary_url}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label={t('Binary Size')}>
              {selectedVersion.binary_size ? `${(selectedVersion.binary_size / 1024 / 1024).toFixed(2)} MB` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Binary Hash')}>
              {selectedVersion.binary_hash || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Config Template')}>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {selectedVersion.config_template || t('No config template')}
                </pre>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t('Ansible Script')}>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {selectedVersion.ansible_script || t('No ansible script')}
                </pre>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t('Extra Variables')}>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {selectedVersion.extra_vars || t('No extra variables')}
                </pre>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t('Release Notes')}>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {selectedVersion.release_notes || t('No release notes')}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label={t('Created')}>
              {new Date(selectedVersion.create_at * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('Created By')}>
              {selectedVersion.create_by}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default AgentManagement;
