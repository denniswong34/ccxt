'use strict'

const ccxt = require('../../ccxt');
//const huobipro = new ccxt['zb']({apiKey:"dccb6988-67a8c33b-d422fd28-e2817", secret:"645479f9-c14be238-d9d69305-9d62c"});
const huobipro = new ccxt['zb']({apiKey:"e842ad88-002b-43cb-b5ba-baf9884ec9d1", secret:"9282b925-8ca2-469f-a95b-79bb1bf8263f"});

async function main() {
  console.log(await huobipro.fetchDepositAddress('ETH'));
}

main();
