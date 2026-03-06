import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Tabs, Modal } from 'antd';
import { SaveOutlined, PlayCircleOutlined, CodeOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Component } from '../types';
import { putComponent } from '../services';

const { TextArea } = Input;

interface AgentTemplateManagementProps {
  component: Component;
  onUpdate: () => void;
}

const AgentTemplateManagement: React.FC<AgentTemplateManagementProps> = ({ component, onUpdate }) => {
  const { t } = useTranslation('builtInComponents');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('config_template');
  const [previewData, setPreviewData] = useState('');

  useEffect(() => {
    form.setFieldsValue({
      config_template: component.config_template || '',
      ansible_script: component.ansible_script || '',
      extra_vars: component.extra_vars || '',
    });
  }, [component, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await putComponent({
        ...component,
        ...values,
      });
      message.success(t('Agent template saved successfully'));
      onUpdate();
    } catch (error) {
      console.error('Failed to save agent template:', error);
      message.error(t('Failed to save agent template'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestScript = () => {
    Modal.info({
      title: t('Test Ansible Script'),
      content: t('This feature will be implemented to test the Ansible script syntax and basic validation.'),
    });
  };

  const handleValidateJSON = () => {
    try {
      const extraVars = form.getFieldValue('extra_vars');
      if (extraVars) {
        JSON.parse(extraVars);
        message.success(t('JSON format is valid'));
      } else {
        message.warning(t('Please input JSON content first'));
      }
    } catch (error) {
      message.error(t('Invalid JSON format'));
    }
  };

  const handlePreview = () => {
    const template = form.getFieldValue('config_template');
    if (!template) {
      message.warning(t('Please input configuration template first'));
      return;
    }

    // 简单的模板变量替换预览
    const preview = template
      .replace(/\{\{.*?agent_type.*?\}\}/g, component.agent_type || 'categraf')
      .replace(/\{\{.*?install_path.*?\}\}/g, `/opt/${component.agent_type || 'categraf'}`)
      .replace(/\{\{.*?config_path.*?\}\}/g, `/opt/${component.agent_type || 'categraf'}/conf`)
      .replace(/\{\{.*?log_path.*?\}\}/g, `/var/log/${component.agent_type || 'categraf'}`);

    setPreviewData(preview);
    setActiveTab('preview');
  };

  const items = [
    {
      key: 'config_template',
      label: t('Configuration Template'),
      children: (
        <div>
          <Form.Item
            label={t('Agent Configuration Template')}
            name="config_template"
            rules={[{ required: true, message: t('Please input configuration template') }]}
          >
            <TextArea
              rows={20}
              placeholder={`# ${component.ident} Agent Configuration
[global]
interval = 15
debug = false

[heartbeat]
enabled = true
urls = ["http://localhost:8080/api/v1/n9e/heartbeat"]

[log]
file_name = "/var/log/${component.ident}/agent.log"
max_size = 100
max_age = 30
max_backups = 10

# Add your specific configuration here
[inputs.cpu]
interval = 10s

[inputs.memory]
interval = 10s

[inputs.disk]
interval = 30s`}
            />
          </Form.Item>
          <Space>
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              {t('Preview Configuration')}
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'ansible_script',
      label: t('Ansible Script'),
      children: (
        <div>
          <Form.Item
            label={t('Deployment Script')}
            name="ansible_script"
            rules={[{ required: true, message: t('Please input Ansible script') }]}
          >
            <TextArea
              rows={20}
              placeholder={`---
- name: Deploy ${component.ident} agent
  hosts: all
  become: yes
  vars:
    agent_binary_url: "{{ agent_binary_url | default('${component.agent_binary_url || 'https://example.com/agent.tar.gz'}') }}"
    agent_type: "{{ agent_type | default('${component.agent_type || 'categraf'}') }}"
    install_path: "{{ install_path | default('/opt/categraf') }}"
    
  tasks:
    - name: Create installation directory
      file:
        path: "{{ install_path }}"
        state: directory
        mode: '0755'
      
    - name: Download agent binary
      get_url:
        url: "{{ agent_binary_url }}"
        dest: "/tmp/{{ agent_type }}.tar.gz"
        timeout: 300
      
    - name: Extract agent binary
      unarchive:
        src: "/tmp/{{ agent_type }}.tar.gz"
        dest: "{{ install_path }}"
        remote_src: yes
        creates: "{{ install_path }}/{{ agent_type }}"
        
    - name: Create agent configuration directory
      file:
        path: "{{ install_path }}/conf"
        state: directory
        mode: '0755'
        
    - name: Create agent configuration
      template:
        src: agent.conf.j2
        dest: "{{ install_path }}/conf/agent.conf"
        mode: '0644'
        
    - name: Create systemd service file
      template:
        src: "{{ agent_type }}.service.j2"
        dest: "/etc/systemd/system/{{ agent_type }}.service"
        mode: '0644'
        
    - name: Reload systemd
      systemd:
        daemon_reload: yes
        
    - name: Start agent service
      systemd:
        name: "{{ agent_type }}"
        state: started
        enabled: yes`}
            />
          </Form.Item>
          <Space>
            <Button icon={<PlayCircleOutlined />} onClick={handleTestScript}>
              {t('Test Script')}
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'extra_vars',
      label: t('Deployment Variables'),
      children: (
        <div>
          <Form.Item
            label={t('Default Extra Variables (JSON)')}
            name="extra_vars"
          >
            <TextArea
              rows={10}
              placeholder={`{
  "agent_binary_url": "${component.agent_binary_url || 'https://example.com/agent.tar.gz'}",
  "install_path": "/opt/${component.agent_type || 'categraf'}",
  "config_path": "/opt/${component.agent_type || 'categraf'}/conf",
  "log_path": "/var/log/${component.agent_type || 'categraf'}",
  "service_name": "${component.agent_type || 'categraf'}",
  "heartbeat_url": "http://localhost:8080/api/v1/n9e/heartbeat"
}`}
            />
          </Form.Item>
          <Space>
            <Button icon={<CodeOutlined />} onClick={handleValidateJSON}>
              {t('Validate JSON')}
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'preview',
      label: t('Preview'),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h4>{t('Configuration Preview')}</h4>
            <p style={{ color: '#666' }}>
              {t('This is a preview of the configuration with default variables applied.')}
            </p>
          </div>
          <TextArea
            rows={20}
            value={previewData}
            readOnly
            style={{ fontFamily: 'monospace' }}
          />
        </div>
      ),
    },
  ];

  return (
    <Card title={t('Agent Template Management')} extra={
      <Space>
        <Button icon={<SaveOutlined />} type="primary" loading={loading} onClick={handleSave}>
          {t('Save Template')}
        </Button>
      </Space>
    }>
      <Form form={form} layout="vertical">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {items.map(item => (
            <Tabs.TabPane key={item.key} tab={item.label}>
              {item.children}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </Form>
    </Card>
  );
};

export default AgentTemplateManagement;
