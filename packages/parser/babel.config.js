const isDevelopment = process.env.NODE_ENV === 'development'
module.exports = {
  extends: '../../babel.config.js',
  ignore: isDevelopment
    ? []
    : ['**/stories/**', '**/__tests__/**', '**/tests/**'],
}
