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
import { Button, Card, Input, Modal, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, DesktopOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getManagedHosts, deleteManagedHosts } from '@/services/hosts';
import { IManagedHost } from '@/types/hosts';
import ManagedHostsTable from './ManagedHostsTable';
import ManagedHostModal from './ManagedHostModal';
import BatchImportModal from './BatchImportModal';
import PageLayout from '@/components/pageLayout';

const { Search } = Input;

const ManagedHosts: React.FC = () => {
  const { t } = useTranslation('hosts');
  const [hosts, setHosts] = useState<IManagedHost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isBatchImportModalVisible, setIsBatchImportModalVisible] = useState<boolean>(false);
  const [editingHost, setEditingHost] = useState<IManagedHost | undefined>(undefined);

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const { list, total } = await getManagedHosts({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        query: searchQuery,
      });
      setHosts(list);
      setPagination({
        ...pagination,
        total,
      });
    } catch (error) {
      console.error('Failed to fetch managed hosts:', error);
      message.error(t('Failed to fetch managed hosts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, [pagination.current, pagination.pageSize, searchQuery]);

  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('Delete Host'),
      content: t('Are you sure you want to delete this host?'),
      onOk: async () => {
        try {
          await deleteManagedHosts([id]);
          message.success(t('Host deleted successfully'));
          fetchHosts(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete host:', error);
          message.error(t('Failed to delete host'));
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('Please select at least one host to delete'));
      return;
    }
    Modal.confirm({
      title: t('Delete Hosts'),
      content: t('Are you sure you want to delete the selected hosts?'),
      onOk: async () => {
        try {
          await deleteManagedHosts(selectedRowKeys as number[]);
          message.success(t('Hosts deleted successfully'));
          setSelectedRowKeys([]);
          fetchHosts(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete hosts:', error);
          message.error(t('Failed to delete hosts'));
        }
      },
    });
  };

  const handleEdit = (host: IManagedHost) => {
    setEditingHost(host);
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
    setEditingHost(undefined);
    fetchHosts(); // Refresh the list
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingHost(undefined);
  };

  const handleBatchImportModalOk = () => {
    setIsBatchImportModalVisible(false);
    fetchHosts(); // Refresh the list
  };

  const handleBatchImportModalCancel = () => {
    setIsBatchImportModalVisible(false);
  };

  return (
    <PageLayout icon={<DesktopOutlined />} title={t('title')}>
      <div className='managed-hosts'>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space>
              <Search
                placeholder={t('Search by target_ident or host_ip')}
                onSearch={handleSearch}
                enterButton
                style={{ width: 300 }}
              />
            </Space>
            <Space>
              <Button type='primary' icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                {t('Add')}
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setIsBatchImportModalVisible(true)}>
                {t('Batch Import')}
              </Button>
              <Button icon={<DeleteOutlined />} onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
                {t('Batch Delete')}
              </Button>
            </Space>
          </div>
          <ManagedHostsTable
            hosts={hosts}
            loading={loading}
            pagination={pagination}
            onTableChange={handleTableChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
          />
        </Card>
        <ManagedHostModal
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          editingHost={editingHost}
        />
        <BatchImportModal
          visible={isBatchImportModalVisible}
          onOk={handleBatchImportModalOk}
          onCancel={handleBatchImportModalCancel}
        />
      </div>
    </PageLayout>
  );
};

export default ManagedHosts;