import en_US from './en_US';
import zh_CN from './zh_CN';
import zh_HK from './zh_HK';
import ja_JP from './ja_JP';
import ru_RU from './ru_RU';

const resources = {
  sideMenu: {
    en_US: { ...en_US, 'hosts.title': 'Managed Hosts' },
    zh_CN: { ...zh_CN, 'hosts.title': '设备管理' },
    zh_HK: { ...zh_HK, 'hosts.title': '設備管理' },
    ja_JP: { ...ja_JP, 'hosts.title': 'Managed Hosts' },
    ru_RU: { ...ru_RU, 'hosts.title': 'Managed Hosts' },
  },
};

export default resources;
