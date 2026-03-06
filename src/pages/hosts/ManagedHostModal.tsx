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
import { Modal, Form, Input, Select, Checkbox, Upload, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { InboxOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { IManagedHost } from '@/types/hosts';
import { createManagedHost, updateManagedHost } from '@/services/hosts';

const { Dragger } = Upload;
const { Option } = Select;
const { TextArea } = Input;

interface IProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  editingHost?: IManagedHost;
}

const ManagedHostModal: React.FC<IProps> = ({ visible, onOk, onCancel, editingHost }) => {
  const { t } = useTranslation('hosts');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  
  const authMethod = Form.useWatch('auth_method', form);

  useEffect(() => {
    if (visible) {
      if (editingHost) {
        form.setFieldsValue({
          host_ident: editingHost.host_ident,
          ssh_ip: editingHost.ssh_ip,
          ssh_port: editingHost.ssh_port || 22,
          ssh_user: editingHost.ssh_user,
          auth_method: editingHost.auth_method,
          credential_ref: editingHost.credential_ref,
          note: editingHost.note,
          sudo_required: editingHost.sudo_required,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ 
          ssh_port: 22,
          auth_method: 'password',
          sudo_required: false,
        });
      }
    }
  }, [visible, editingHost]);

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        if (editingHost) {
          await updateManagedHost(editingHost.id, values);
          message.success(t('Host updated successfully'));
        } else {
          await createManagedHost([values]);
          message.success(t('Host created successfully'));
        }
        onOk();
      } catch (error) {
        console.error('Failed to save host:', error);
        message.error(t('Failed to save host'));
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      title={editingHost ? t('Edit Host') : t('Add Host')}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          name='host_ident'
          label={t('Host Ident')}
          rules={[{ required: true, message: t('Please input host ident') }]}
        >
          <Input placeholder={t('e.g., server-01')} />
        </Form.Item>
        <Form.Item
          name='ssh_ip'
          label={t('SSH IP')}
          rules={[{ required: true, message: t('Please input SSH IP') }]}
        >
          <Input placeholder={t('e.g., 192.168.1.100')} />
        </Form.Item>
        <Form.Item
          name='ssh_port'
          label={t('SSH Port')}
          rules={[{ required: true, message: t('Please input SSH port') }]}
        >
          <Input type='number' placeholder="22" />
        </Form.Item>
        <Form.Item
          name='ssh_user'
          label={t('SSH User')}
          rules={[{ required: true, message: t('Please input SSH user') }]}
        >
          <Input placeholder={t('e.g., root')} />
        </Form.Item>
        <Form.Item
          name='auth_method'
          label={t('Auth Method')}
          rules={[{ required: true, message: t('Please select auth method') }]}
        >
          <Select>
            <Option value='key'>{t('SSH Key')}</Option>
            <Option value='password'>{t('Password')}</Option>
          </Select>
        </Form.Item>
        {authMethod === 'key' ? (
          <Form.Item
            name='credential_ref'
            label={t('SSH Private Key')}
            rules={[{ required: true, message: t('Please input private key') }]}
          >
            <TextArea rows={4} placeholder={t('Paste your private key here')} />
          </Form.Item>
        ) : null}
        {authMethod === 'password' ? (
          <Form.Item
            name='credential_ref'
            label={t('SSH Password')}
            rules={[{ required: true, message: t('Please input password') }]}
          >
            <Input.Password placeholder={t('Enter SSH password')} />
          </Form.Item>
        ) : null}
        <Form.Item name='note' label={t('Note')}>
          <TextArea rows={2} placeholder={t('Optional notes about this host')} />
        </Form.Item>
        <Form.Item name='sudo_required' valuePropName='checked'>
          <Checkbox>{t('Require sudo for deployment')}</Checkbox>
        </Form.Item>
        <Form.Item>
          <div style={{ color: 'red', fontSize: '12px' }}>
            {t('Security Tip: Please ensure your SSH credentials are secure and properly configured.')}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ManagedHostModal;