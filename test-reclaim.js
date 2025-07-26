const { ReclaimProofRequest } = require('@reclaimprotocol/js-sdk');

(async () => {
  try {
    const req = await ReclaimProofRequest.init(
      '0xe881BF2db8D9ef63cF268D1e15A810175C1522e0', // your App ID
      '0x67458f2d3951e98a877b802cba2c9102a1ea3d7f504d7f91cbc2984355826fed', // your App Secret
      'f9f383fd-32d9-4c54-942f-5e9fda349762' // Gmail provider
    );
    console.log('Success', req);
  } catch (err) {
    console.error('FAILED:', err);
  }
})();