/*
 * Doris 等多数据源类型的 Recording Rule 表单
 * 支持 query_configs 格式
 */
import React, { useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, Select, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { addOrEditRecordingRule } from '@/services/recording';
import { CommonStateContext } from '@/App';
import CronPattern from '@/components/CronPattern';
import KVTagSelect, { validatorOfKVTagSelect } from '@/components/KVTagSelect';
import { getBusiGroups } from '@/components/BusinessGroup/services';
import { useRequest } from 'ahooks';

const goListPath = '/recording-rules';

export interface RecordingRuleFormProps {
  form: any;
  initialValues?: {
    cron_pattern?: string;
    query_configs?: any[];
    group_id?: number;
    name?: string;
    note?: string;
    append_tags?: any;
  };
}

export function ActionButtons({ form, onOk, onCancel }: { form: any; onOk: () => void; onCancel: () => void }) {
  const { t } = useTranslation('recordingRules');
  const history = useHistory();
  const { businessGroup } = useContext(CommonStateContext);

  const handleOk = () => {
    form.validateFields().then(async (values: any) => {
      const queryConfigs = form.getFieldValue('query_configs');
      const d = {
        ...values,
        cluster: '0',
        query_configs: Array.isArray(queryConfigs) ? queryConfigs : [],
      };
      try {
        const { dat } = await addOrEditRecordingRule([d], values.group_id, 'Post');
        const errorNum = Object.values(dat).filter(Boolean).length;
        if (!errorNum) {
          message.success(t('common:success.add'));
          onOk();
          history.push({ pathname: goListPath, search: `ids=${values.group_id}&isLeaf=true` });
        } else {
          message.error(t('common:request_fail_msg'));
        }
      } catch {
        message.error(t('common:request_fail_msg'));
      }
    });
  };

  return (
    <Space>
      <Button type='primary' onClick={handleOk}>
        {t('common:btn.save')}
      </Button>
      <Button onClick={onCancel}>{t('common:btn.cancel')}</Button>
    </Space>
  );
}

export default function RecordingRuleForm({ form, initialValues = {} }: RecordingRuleFormProps) {
  const { t } = useTranslation('recordingRules');
  const { businessGroup } = useContext(CommonStateContext);

  const { data: busiGroups } = useRequest(() => getBusiGroups(), { refreshDeps: [] });

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        group_id: initialValues.group_id ?? businessGroup?.id,
        query_configs: initialValues.query_configs,
      });
    }
  }, [initialValues, businessGroup?.id]);

  return (
    <div className='fc-border p-4'>
      <Form form={form} className='strategy-form' layout='vertical'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Form.Item label={t('group_id')} name='group_id' rules={[{ required: true, message: t('group_id_required') }]}>
            <Select
              options={_.map(busiGroups, (item) => ({ label: item.name, value: item.id }))}
              showSearch
              optionFilterProp='label'
            />
          </Form.Item>
          <Form.Item
            required
            label={t('name')}
            tooltip={t('name_tip')}
            name='name'
            rules={[{ required: true }, { pattern: new RegExp(/^[0-9a-zA-Z_:]{1,}$/, 'g'), message: 'name_msg' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('note')} name='note'>
            <Input />
          </Form.Item>
          <CronPattern name='cron_pattern' />
          <Form.Item label={t('append_tags')} name='append_tags' rules={[validatorOfKVTagSelect]}>
            <KVTagSelect />
          </Form.Item>
        </Space>
      </Form>
    </div>
  );
}
