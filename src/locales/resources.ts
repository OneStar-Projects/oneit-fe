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
import datasourceLocale from './datasource/locale';
import commonLocale from './common/locale';
import * as hosts from './hosts/index';

const resources = {
  en_US: {
    common: commonLocale.common.en_US,
    datasource: datasourceLocale.datasource.en_US,
    hosts: hosts.en_US,
  },
  zh_CN: {
    common: commonLocale.common.zh_CN,
    datasource: datasourceLocale.datasource.zh_CN,
    hosts: hosts.zh_CN,
  },
  zh_HK: {
    common: commonLocale.common.zh_HK,
    datasource: datasourceLocale.datasource.zh_HK,
    hosts: hosts.zh_CN,
  },
  ja_JP: {
    common: commonLocale.common.ja_JP,
    datasource: datasourceLocale.datasource.ja_JP,
    hosts: hosts.en_US,
  },
  ru_RU: {
    common: commonLocale.common.ru_RU,
    datasource: datasourceLocale.datasource.ru_RU,
    hosts: hosts.en_US,
  },
};

export default resources;
