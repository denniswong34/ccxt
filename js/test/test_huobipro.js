'use strict'

const ccxt = require('../../ccxt');
//const liqui = new ccxt['okex']({apiKey:"d162c8e4-0742-41da-943e-ae1b798e5a89", secret: "EC32BCE26BCE68E09E24BD8668657979"});
//const liqui = new ccxt['cobinhood']({verbose: true, apiKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfdG9rZW5faWQiOiIxZWI1YmIyNi00YjMzLTRmMGQtYmFlMS01MGI5MTQ3MDBkY2IiLCJzY29wZSI6WyJzY29wZV9leGNoYW5nZV90cmFkZV9yZWFkIiwic2NvcGVfZXhjaGFuZ2VfdHJhZGVfd3JpdGUiLCJzY29wZV9leGNoYW5nZV9sZWRnZXJfcmVhZCJdLCJ1c2VyX2lkIjoiNzQzNzBlZjctNjBjNC00YWJhLTg0NjEtYmJhZTVkMmY3YjMwIn0.rMcK5PAOxVtefLVRRj3OpZTOfQq_oxTjJA0I1POn1w0.V1:859d80391fb99eb32814bf4c9167773c28af836905569199030c0583fbb2b282", secret: "V1:859d80391fb99eb32814bf4c9167773c28af836905569199030c0583fbb2b282"});
const liqui = new ccxt['bittrex']({verbose: true, apiKey: "a544aa6e8f394f67951498974347fa61", secret: "0884aa6717e945aa94e6d5e24c8a54ad"});
//const liqui = new ccxt['liqui']({apiKey:"TG5MQ8V0-PKVM198W-JK74AGXD-WC2D27VM-E7G2CDMO", secret:"d9f26fa4b4c56e406c30c9ad0ad486fbe290a5565b1975610bf949c52dcf1860"});
//const liqui = new ccxt['ccex']({apiKey:"F778EFB42601FE6BAF478E2A14FB1D97", secret:"51AFDA08D7947469F82A06677D49574E"});
//

//const liqui = new ccxt['yobit']({apiKey:"FC06638500B74292BEB463E0B8B54F68", secret:"c5a27b5b987873df5cb50dbeb0a2f27f"});
async function main() {
  //await liqui.loadMarkets();
  //console.log(await liqui.createDepositAddress('STK'));
  const market = await liqui.fetchDepositAddress('ZCL');

  console.log(market); // should truncate to 1.12345678
}

main();
