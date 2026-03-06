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
import React, { useState } from 'react';
import { Modal, Upload, message, Table, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { InboxOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { importManagedHosts } from '@/services/hosts';

const { Dragger } = Upload;
const { TabPane } = Tabs;

interface IProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

interface IImportResult {
  success: boolean;
  target_ident: string;
  message?: string;
}

const BatchImportModal: React.FC<IProps> = ({ visible, onOk, onCancel }) => {
  const { t } = useTranslation('hosts');
  const [importResults, setImportResults] = useState<IImportResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [loading, setLoading] = useState<boolean>(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const results = await importManagedHosts(file);
      setImportResults(results);
      setActiveTab('result');
      message.success(t('File uploaded successfully'));
    } catch (error) {
      console.error('Failed to upload file:', error);
      message.error(t('Failed to upload file'));
    } finally {
      setLoading(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleOk = () => {
    onOk();
    resetModal();
  };

  const handleCancel = () => {
    onCancel();
    resetModal();
  };

  const resetModal = () => {
    setImportResults([]);
    setActiveTab('upload');
  };

  const successList = importResults.filter((item) => item.success);
  const failedList = importResults.filter((item) => !item.success);

  const resultColumns = [
    {
      title: t('target_ident'),
      dataIndex: 'target_ident',
      key: 'target_ident',
    },
    {
      title: t('message'),
      dataIndex: 'message',
      key: 'message',
    },
  ];

  return (
    <Modal
      title={t('Batch Import')}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText={t('Done')}
      cancelText={t('Cancel')}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('Upload')} key='upload'>
          <Dragger
            beforeUpload={handleUpload}
            disabled={loading}
            accept='.csv'
          >
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='ant-upload-text'>{t('Click or drag file to this area to upload')}</p>
            <p className='ant-upload-hint'>{t('Support for a single CSV file upload')}</p>
            <p className='ant-upload-hint'>
              {t('CSV Format:')}
              <pre>
                target_ident,ssh_ip,ssh_port,ssh_user,auth_method,credential,note,sudo_required{'\n'}
                myhost1,192.168.1.10,22,root,key,"-----BEGIN OPENSSH PRIVATE KEY-----...",Server 1,true{'\n'}
                myhost2,,22,admin,password,mypassword,Server 2,false
              </pre>
            </p>
          </Dragger>
        </TabPane>
        <TabPane tab={t('Result')} key='result'>
          <Tabs>
            <TabPane tab={`${t('Success')} (${successList.length})`} key='success'>
              {successList.length > 0 ? (
                <Table
                  dataSource={successList}
                  columns={resultColumns}
                  pagination={false}
                  rowKey='target_ident'
                />
              ) : (
                <p>{t('No successful imports')}</p>
              )}
            </TabPane>
            <TabPane tab={`${t('Failed')} (${failedList.length})`} key='failed'>
              {failedList.length > 0 ? (
                <Table
                  dataSource={failedList}
                  columns={resultColumns}
                  pagination={false}
                  rowKey='target_ident'
                />
              ) : (
                <p>{t('No failed imports')}</p>
              )}
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default BatchImportModal;