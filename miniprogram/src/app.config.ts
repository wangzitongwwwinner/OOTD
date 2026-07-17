export default defineAppConfig({
  pages: ['pages/index/index'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#faf9f7',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '穿衣有数',
  },
  lazyCodeLoading: 'requiredComponents',
  sitemapLocation: 'sitemap.json',
});
