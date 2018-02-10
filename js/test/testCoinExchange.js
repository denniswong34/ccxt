'use strict'

const ccxt = require('../../ccxt');
const coinexchange = new ccxt['coinexchange'];

async function main() {
  const orderBooks = coinexchange.fetchOrderBook('KAYI/BTC');
  console.log(JSON.stringify(orderBooks));
}

main();
