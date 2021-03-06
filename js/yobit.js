'use strict';

// ---------------------------------------------------------------------------

const liqui = require ('./liqui.js');
const { ExchangeError, InsufficientFunds, DDoSProtection } = require ('./base/errors');

// ---------------------------------------------------------------------------

module.exports = class yobit extends liqui {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'yobit',
            'name': 'YoBit',
            'countries': 'RU',
            'rateLimit': 3000, // responses are cached every 2 seconds
            'version': '3',
            'has': {
                'createDepositAddress': true,
                'fetchDepositAddress': true,
                'CORS': false,
                'withdraw': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766910-cdcbfdae-5eea-11e7-9859-03fea873272d.jpg',
                'api': {
                    'public': 'https://yobit.net/api',
                    'private': 'https://yobit.net/tapi',
                },
                'www': 'https://www.yobit.net',
                'doc': 'https://www.yobit.net/en/api/',
                'fees': 'https://www.yobit.net/en/fees/',
            },
            'api': {
                'public': {
                    'get': [
                        'depth/{pair}',
                        'info',
                        'ticker/{pair}',
                        'trades/{pair}',
                    ],
                },
                'private': {
                    'post': [
                        'ActiveOrders',
                        'CancelOrder',
                        'GetDepositAddress',
                        'getInfo',
                        'OrderInfo',
                        'Trade',
                        'TradeHistory',
                        'WithdrawCoinsToAddress',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'maker': 0.002,
                    'taker': 0.002,
                },
                'funding': {
                    'withdraw': {},
                },
            },
            'commonCurrencies': {
                'AIR': 'AirCoin',
                'ANI': 'ANICoin',
                'ANT': 'AntsCoin',
                'ATM': 'Autumncoin',
                'BCC': 'BCH',
                'BCS': 'BitcoinStake',
                'BTS': 'Bitshares2',
                'DCT': 'Discount',
                'DGD': 'DarkGoldCoin',
                'ICN': 'iCoin',
                'LIZI': 'LiZi',
                'LUN': 'LunarCoin',
                'MDT': 'Midnight',
                'NAV': 'NavajoCoin',
                'OMG': 'OMGame',
                'PAY': 'EPAY',
                'REP': 'Republicoin',
            },
            'options': {
                'fetchOrdersRequiresSymbol': true,
            },
        });
    }

    commonCurrencyCode (currency) {
        let substitutions = {
            /*
            'AIR': 'AirCoin',
            'ANI': 'ANICoin',
            'ANT': 'AntsCoin',
            'ATM': 'Autumncoin',
            'ARCX': 'ARC',
            'ATMCHA': 'ATM',
            'BCC': 'BCH',
            'BCS': 'BitcoinStake',
            'BTS': 'Bitshares2',
            'COVX': 'COV',
            'DCT': 'Discount',
            'DGD': 'DarkGoldCoin',
            'EDR2': 'EDR',
            'GEN': 'G3N',
            'HYPERX': 'HYPER',
            'LBTCX': 'LBTC',
            'ICN': 'iCoin',
            'LIZI': 'LiZi',
            'LUN': 'LunarCoin',
            'LUNYR': 'LUN',
            'MDT': 'Midnight',
            'NAV': 'NavajoCoin',
            'OMG': 'OMGame',
            'PAY': 'EPAY',
            'REP': 'Republicoin',
            'PRS': 'PRE',
            'VSLICE': 'VSL',*/
        };
        if (currency in substitutions)
            return substitutions[currency];
        return currency;
    }

    currencyId (commonCode) {
        let substitutions = {
            /*
            'AirCoin': 'AIR',
            'ARC': 'ARCX',
            'ATM': 'ATMCHA',
            'ANICoin': 'ANI',
            'AntsCoin': 'ANT',
            'Autumncoin': 'ATM',
            'BCH': 'BCC',
            'BitcoinStake': 'BCS',
            'Bitshares2': 'BTS',
            'COV': 'COVX',
            'Discount': 'DCT',
            'DarkGoldCoin': 'DGD',
            'EDR': 'EDR2',
            'G3N': 'GEN',
            'HYPER': 'HYPERX',
            'iCoin': 'ICN',
            'LiZi': 'LIZI',
            'LunarCoin': 'LUN',
            'LBTC': 'LBTCX',
            'LUN': 'LUNYR',
            'PRE': 'PRS',
            'Midnight': 'MDT',
            'NavajoCoin': 'NAV',
            'OMGame': 'OMG',
            'EPAY': 'PAY',
            'Republicoin': 'REP',
            'VSL': 'VSLICE',*/
        };
        if (commonCode in substitutions)
            return substitutions[commonCode];
        return commonCode;
    }

    parseOrderStatus (status) {
        let statuses = {
            '0': 'open',
            '1': 'closed',
            '2': 'canceled',
            '3': 'open', // or partially-filled and closed? https://github.com/ccxt/ccxt/issues/1594
        };
        if (status in statuses)
            return statuses[status];
        return status;
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        let response = await this.privatePostGetInfo ();
        let balances = response['return'];
        let result = { 'info': balances };
        let sides = { 'free': 'funds', 'total': 'funds_incl_orders' };
        let keys = Object.keys (sides);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let side = sides[key];
            if (side in balances) {
                let currencies = Object.keys (balances[side]);
                for (let j = 0; j < currencies.length; j++) {
                    let lowercase = currencies[j];
                    let uppercase = lowercase.toUpperCase ();
                    let currency = this.commonCurrencyCode (uppercase);
                    let account = undefined;
                    if (currency in result) {
                        account = result[currency];
                    } else {
                        account = this.account ();
                    }
                    account[key] = balances[side][lowercase];
                    if (account['total'] && account['free'])
                        account['used'] = account['total'] - account['free'];
                    result[currency] = account;
                }
            }
        }
        return this.parseBalance (result);
    }

    async createDepositAddress (code, params = {}) {
        let response = await this.fetchDepositAddress (code, this.extend ({
            'need_new': 1,
        }, params));
        let address = this.safeString (response, 'address');
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'status': 'ok',
            'info': response['info'],
        };
    }
    async fetchTickers (symbols = undefined, params = {}) {
        var chunkSize = 61;
        if('chunkSize' in params)
            chunkSize = params['chunkSize'];
        return super.fetchTickers(symbols, this.extend({'chunkSize': chunkSize}, params));
    }

    async fetchDepositAddress (code, params = {}) {
        let currency = this.currency (code);
        let request = {
            'coinName': currency['id'],
            'need_new': 0,
        };
        let response = await this.privatePostGetDepositAddress (this.extend (request, params));
        let address = this.safeString (response['return'], 'address');
        this.checkAddress (address);
        return {
            'currency': code,
            'address': address,
            'status': 'ok',
            'info': response,
        };
    }

    async withdraw (currency, amount, address, tag = undefined, params = {}) {
        this.checkAddress (address);
        await this.loadMarkets ();
        let response = await this.privatePostWithdrawCoinsToAddress (this.extend ({
            'coinName': currency,
            'amount': amount,
            'address': address,
        }, params));
        return {
            'info': response,
            'id': undefined,
        };
    }

    async request (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let response = await this.fetch2 (path, api, method, params, headers, body);
        if ('success' in response) {
            if (!response['success']) {
                if (response['error'].indexOf ('Insufficient funds') >= 0) { // not enougTh is a typo inside Liqui's own API...
                    throw new InsufficientFunds (this.id + ' ' + this.json (response));
                } else if (response['error'] === 'Requests too often') {
                    throw new DDoSProtection (this.id + ' ' + this.json (response));
                } else if ((response['error'] === 'not available') || (response['error'] === 'external service unavailable')) {
                    throw new DDoSProtection (this.id + ' ' + this.json (response));
                } else {
                    throw new ExchangeError (this.id + ' ' + this.json (response));
                }
            }
        }
        return response;
    }
};
