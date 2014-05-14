exports.auth =
  {
    fb:
      {
        clientID: '1437410026515060',
        clientSecret: '872aa85f7fded7044fd3109c977144b8',
        callbackUrl: 'http://localhost:3000/auth/facebook/callback'
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
