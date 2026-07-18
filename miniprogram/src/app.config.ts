export default defineAppConfig({
  pages: ['pages/index/index'],
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
