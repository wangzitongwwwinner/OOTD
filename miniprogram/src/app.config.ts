export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/scenes/index',
    'pages/wardrobe/index',
    'pages/try-on/index',
    'pages/profile/index',
  ],
  tabBar: {
    custom: true,
    color: '#685c50',
    selectedColor: '#2d2926',
    backgroundColor: '#faf9f7',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/scenes/index', text: '场景库' },
      { pagePath: 'pages/wardrobe/index', text: '衣橱' },
      { pagePath: 'pages/try-on/index', text: '试穿' },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#faf9f7',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '穿衣有数',
  },
  lazyCodeLoading: 'requiredComponents',
  permission: {
    'scope.userLocation': {
      desc: '用于识别所在城市并提供当地天气与穿衣建议',
    },
  },
  requiredPrivateInfos: ['getLocation'],
  sitemapLocation: 'sitemap.json',
});
