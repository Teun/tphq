exports.auth =
  {
    fb:
      {
        clientID: 'dafadf',
        clientSecret: 'adfad',
        callbackUrl: 'http://localhost/callback'
      }
  };
exports.server = 
  {
    port: 3000
  };
exports.data = {
  planPath: 'data/plans/',
  userStore: { conn: 'mongodb://localhost/tphq', secret: 'wawawa' }
};
