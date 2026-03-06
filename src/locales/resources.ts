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
import * as datasource from './datasource';
import * as common from './common';
import * as hosts from './hosts/index';

const resources = {
  en_US: {
    common: common.en_US,
    datasource: datasource.en_US,
    hosts: hosts.en_US,
  },
  zh_CN: {
    common: common.zh_CN,
    datasource: datasource.zh_CN,
    hosts: hosts.zh_CN,
  },
  zh_HK: {
    common: common.zh_HK,
    datasource: datasource.zh_HK,
    hosts: hosts.zh_CN, // 默认使用简体中文
  },
  ja_JP: { 
    common: common.ja_JP, 
    datasource: datasource.ja_JP,
    hosts: hosts.en_US, // 默认使用英文
  },
  ru_RU: { 
    common: common.ru_RU, 
    datasource: datasource.ru_RU,
    hosts: hosts.en_US, // 默认使用英文
  },
};

export default resources;
