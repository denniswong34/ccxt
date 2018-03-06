'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const sleep = require('system-sleep');
const { ExchangeError, AuthenticationError, InsufficientFunds, OrderNotFound, ExchangeNotAvailable, DDoSProtection, InvalidOrder } = require ('./base/errors');

//  ---------------------------------------------------------------------------

module.exports = class zb extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'zb',
            'name': 'ZB',
            'countries': 'CN',
            'rateLimit': 1000,
            'version': 'v1',
            'has': {
                'CORS': false,
                'fetchOHLCV': true,
                'fetchTickers': true,
                'createMarketOrder': false,
                'fetchOrder': true,
                'fetchOrders': true,
                'fetchOpenOrders': true,
                'withdraw': true,
                'fetchDepositAddress': true,
            },
            'timeframes': {
                '1m': '1min',
                '3m': '3min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '1hour',
                '2h': '2hour',
                '4h': '4hour',
                '6h': '6hour',
                '12h': '12hour',
                '1d': '1day',
                '3d': '3day',
                '1w': '1week',
            },
            'exceptions': {
                // '1000': 'Successful operation',
                '1001': ExchangeError, // 'General error message',
                '1002': ExchangeError, // 'Internal error',
                '1003': AuthenticationError, // 'Verification does not pass',
                '1004': AuthenticationError, // 'Funding security password lock',
                '1005': AuthenticationError, // 'Funds security password is incorrect, please confirm and re-enter.',
                '1006': AuthenticationError, // 'Real-name certification pending approval or audit does not pass',
                '1009': ExchangeNotAvailable, // 'This interface is under maintenance',
                '2001': InsufficientFunds, // 'Insufficient CNY Balance',
                '2002': InsufficientFunds, // 'Insufficient BTC Balance',
                '2003': InsufficientFunds, // 'Insufficient LTC Balance',
                '2005': InsufficientFunds, // 'Insufficient ETH Balance',
                '2006': InsufficientFunds, // 'Insufficient ETC Balance',
                '2007': InsufficientFunds, // 'Insufficient BTS Balance',
                '2009': InsufficientFunds, // 'Account balance is not enough',
                '3001': OrderNotFound, // 'Pending orders not found',
                '3002': InvalidOrder, // 'Invalid price',
                '3003': InvalidOrder, // 'Invalid amount',
                '3004': AuthenticationError, // 'User does not exist',
                '3005': ExchangeError, // 'Invalid parameter',
                '3006': AuthenticationError, // 'Invalid IP or inconsistent with the bound IP',
                '3007': AuthenticationError, // 'The request time has expired',
                '3008': OrderNotFound, // 'Transaction records not found',
                '4001': ExchangeNotAvailable, // 'API interface is locked or not enabled',
                '4002': DDoSProtection, // 'Request too often',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/32859187-cd5214f0-ca5e-11e7-967d-96568e2e2bd1.jpg',
                'api': {
                    'public': 'http://api.zb.com/data', // no https for public API
                    'private': 'https://trade.zb.com/api',
                },
                'www': 'https://trade.zb.com/api',
                'doc': 'https://www.zb.com/i/developer',
                'fees': 'https://www.zb.com/i/rate',
            },
            'api': {
                'public': {
                    'get': [
                        'markets',
                        'ticker',
                        'depth',
                        'trades',
                        'kline',
                    ],
                },
                'private': {
                    'post': [
						'getOrder',
						'getOrders',
						'getOrdersNew',
						'getOrdersIgnoreTradeType',
						'getUnfinishedOrdersIgnoreTradeType',
						'getAccountInfo',
						'getChargeRecord',
						'getCnyWithdrawRecord',
						'getCnyChargeRecord',
						'getWithdrawRecord',
						'getWithdrawAddress',
                    ],
                    'get': [
                        'getUserAddress',
                        'order',
                        'cancelOrder',
                        'withdraw',
                    ],
                },
            },
            'fees': {
                'funding': {
                    'withdraw': {
                        'BTC': 0.0001,
                        'BCH': 0.0006,
                        'LTC': 0.005,
                        'ETH': 0.01,
                        'ETC': 0.01,
                        'BTS': 3,
                        'EOS': 1,
                        'QTUM': 0.01,
                        'HSR': 0.001,
                        'XRP': 0.1,
                        'USDT': '0.1%',
                        'QCASH': 5,
                        'DASH': 0.002,
                        'BCD': 0,
                        'UBTC': 0,
                        'SBTC': 0,
                        'INK': 20,
                        'TV': 0.1,
                        'BTH': 0,
                        'BCX': 0,
                        'LBTC': 0,
                        'CHAT': 20,
                        'bitCNY': 20,
                        'HLC': 20,
                        'BTP': 0,
                        'BCW': 0,
                    },
                },
                'trading': {
                    'maker': 0.2 / 100,
                    'taker': 0.2 / 100,
                },
            },
        });
    }

    async fetchMarkets () {
        let markets = await this.publicGetMarkets ();
        let keys = Object.keys (markets);
        let result = [];
        for (let i = 0; i < keys.length; i++) {
            let id = keys[i];
            let market = markets[id];
            let [ baseId, quoteId ] = id.split ('_');
            let base = this.commonCurrencyCode (baseId.toUpperCase ());
            let quote = this.commonCurrencyCode (quoteId.toUpperCase ());
            let symbol = base + '/' + quote;
            let precision = {
                'amount': market['amountScale'],
                'price': market['priceScale'],
            };
            let lot = Math.pow (10, -precision['amount']);
            result.push ({
                'id': id,
                'symbol': symbol,
                'baseId': baseId,
                'quoteId': quoteId,
                'base': base,
                'quote': quote,
                'lot': lot,
                'active': true,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': lot,
                        'max': undefined,
                    },
                    'price': {
                        'min': Math.pow (10, -precision['price']),
                        'max': undefined,
                    },
                    'cost': {
                        'min': 0,
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        let response = await this.privatePostGetAccountInfo (params);
        // todo: use this somehow
        // let permissions = response['result']['base'];
        let balances = response['result']['coins'];
        let result = { 'info': response };
        for (let i = 0; i < balances.length; i++) {
            let balance = balances[i];
            //     {        enName: "BTC",
            //               freez: "0.00000000",
            //         unitDecimal:  8, // always 8
            //              cnName: "BTC",
            //       isCanRecharge:  true, // TODO: should use this
            //             unitTag: "฿",
            //       isCanWithdraw:  true,  // TODO: should use this
            //           available: "0.00000000",
            //                 key: "btc"         }
            let account = this.account ();
            let currency = balance['key'];
            if (currency in this.currencies_by_id)
                currency = this.currencies_by_id[currency]['code'];
            else
                currency = this.commonCurrencyCode (balance['enName']);
            account['free'] = parseFloat (balance['available']);
            account['used'] = parseFloat (balance['freez']);
            account['total'] = this.sum (account['free'], account['used']);
            result[currency.toUpperCase()] = account;
        }
        return this.parseBalance (result);
    }

    getMarketFieldName () {
        return 'market';
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let marketFieldName = this.getMarketFieldName ();
        let request = {};
        request[marketFieldName] = market['id'];
        let orderbook = await this.publicGetDepth (this.extend (request, params));
        let timestamp = this.milliseconds ();
        let bids = undefined;
        let asks = undefined;
        if ('bids' in orderbook)
            bids = orderbook['bids'];
        if ('asks' in orderbook)
            asks = orderbook['asks'];
        let result = {
            'bids': bids,
            'asks': asks,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
        };
        if (result['bids'])
            result['bids'] = this.sortBy (result['bids'], 0, true);
        if (result['asks'])
            result['asks'] = this.sortBy (result['asks'], 0);
        return result;
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let marketFieldName = this.getMarketFieldName ();
        let request = {};
        request[marketFieldName] = market['id'];
        let response = await this.publicGetTicker (this.extend (request, params));
        let ticker = response['ticker'];
        let timestamp = this.milliseconds ();
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': parseFloat (ticker['high']),
            'low': parseFloat (ticker['low']),
            'bid': parseFloat (ticker['buy']),
            'ask': parseFloat (ticker['sell']),
            'vwap': undefined,
            'open': undefined,
            'close': undefined,
            'first': undefined,
            'last': parseFloat (ticker['last']),
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': parseFloat (ticker['vol']),
            'quoteVolume': undefined,
            'info': ticker,
        };
    }
    
    async fetchTickers (symbols = undefined, params = {}) {
        let markets = await this.fetchMarkets();
        let allRequests = [];
        let error = false;
        let count = 0;
        for(let market of markets) {
        	do {
        		try{
        			allRequests.push(await this.fetchTicker(market.symbol, params));
            	} catch (e) {
            		error = true;
            		sleep(11000);
            		error = false;
            	}
        	} while(error);
        }
        return allRequests;
    }
    
    async fetchDepositAddress (currency, params = {}) {
		let requestParams = "&currency=" + currency.toLowerCase();
        let response = await this.privateGetGetUserAddress(this.extend ({"currency": currency.toLowerCase()}, params));
        if ('message' in response) {
            if (response['message'].des == "success") {
                let address = this.safeString (response.message.datas, 'key');
                return {
                    'currency': currency,
                    'address': address,
                    'status': 'ok',
                    'info': response,
                };
            }
        }
    	
        throw new ExchangeError (this.id + ' fetchDepositAddress failed: ' + this.last_http_response);
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        if (typeof limit === 'undefined')
            limit = 1000;
        let request = {
            'market': market['id'],
            'type': this.timeframes[timeframe],
            'limit': limit,
        };
        if (typeof since !== 'undefined')
            request['since'] = since;
        let response = await this.publicGetKline (this.extend (request, params));
        return this.parseOHLCVs (response['data'], market, timeframe, since, limit);
    }

    parseTrade (trade, market = undefined) {
        let timestamp = trade['date'] * 1000;
        let side = (trade['trade_type'] === 'bid') ? 'buy' : 'sell';
        return {
            'info': trade,
            'id': trade['tid'].toString (),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'type': undefined,
            'side': side,
            'price': parseFloat (trade['price']),
            'amount': parseFloat (trade['amount']),
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let marketFieldName = this.getMarketFieldName ();
        let request = {};
        request[marketFieldName] = market['id'];
        let response = await this.publicGetTrades (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        if (type !== 'limit')
            throw new InvalidOrder (this.id + ' allows limit orders only');
        await this.loadMarkets ();
        let order = {
            'price': this.priceToPrecision (symbol, price),
            'amount': this.amountToString (symbol, amount),
            'tradeType': (side === 'buy') ? '1' : '0',
            'currency': this.marketId (symbol),
        };
        let response = await this.privateGetOrder (this.extend (order, params));
        return {
            'info': response,
            'id': response['id'],
        };
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        let order = {
            'id': id.toString (),
            'currency': this.marketId (symbol),
        };
        order = this.extend (order, params);
        return await this.privateGetCancelOrder (order);
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        let order = {
            'id': id.toString (),
            'currency': this.marketId (symbol),
        };
        order = this.extend (order, params);
        let response = await this.privateGetGetOrder (order);
        return this.parseOrder (response, undefined, true);
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = 50, params = {}) {
        if (!symbol)
            throw new ExchangeError (this.id + 'fetchOrders requires a symbol parameter');
        await this.loadMarkets ();
        let market = this.market (symbol);
        let request = {
            'currency': market['id'],
            'pageIndex': 1, // default pageIndex is 1
            'pageSize': limit, // default pageSize is 50
        };
        let method = 'privateGetGetOrdersIgnoreTradeType';
        // tradeType 交易类型1/0[buy/sell]
        if ('tradeType' in params)
            method = 'privateGetGetOrdersNew';
        let response = undefined;
        try {
            response = await this[method] (this.extend (request, params));
        } catch (e) {
            if (this.last_json_response) {
                let code = this.safeString (this.last_json_response, 'code');
                if (code === '3001')
                    return [];
            }
            throw e;
        }
        return this.parseOrders (response, market, since, limit);
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = 10, params = {}) {
        if (!symbol)
            throw new ExchangeError (this.id + 'fetchOpenOrders requires a symbol parameter');
        await this.loadMarkets ();
        let market = this.market (symbol);
        let request = {
            'currency': market['id'],
            'pageIndex': 1, // default pageIndex is 1
            'pageSize': limit, // default pageSize is 10
        };
        let method = 'privateGetGetUnfinishedOrdersIgnoreTradeType';
        // tradeType 交易类型1/0[buy/sell]
        if ('tradeType' in params)
            method = 'privateGetGetOrdersNew';
        let response = undefined;
        try {
            response = await this[method] (this.extend (request, params));
        } catch (e) {
            if (this.last_json_response) {
                let code = this.safeString (this.last_json_response, 'code');
                if (code === '3001')
                    return [];
            }
            throw e;
        }
        return this.parseOrders (response, market, since, limit);
    }

    parseOrder (order, market = undefined) {
        let side = order['type'] === 1 ? 'buy' : 'sell';
        let type = 'limit'; // market order is not availalbe in ZB
        let timestamp = undefined;
        let createDateField = this.getCreateDateField ();
        if (createDateField in order)
            timestamp = order[createDateField];
        let symbol = undefined;
        if ('currency' in order) {
            // get symbol from currency
            market = this.marketsById[order['currency']];
        }
        if (market)
            symbol = market['symbol'];
        let price = order['price'];
        let average = order['trade_price'];
        let filled = order['trade_amount'];
        let amount = order['total_amount'];
        let remaining = amount - filled;
        let cost = order['trade_money'];
        let status = this.safeString (order, 'status');
        if (typeof status !== 'undefined')
            status = this.parseOrderStatus (status);
        let result = {
            'info': order,
            'id': order['id'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': type,
            'side': side,
            'price': price,
            'average': average,
            'cost': cost,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': undefined,
        };
        return result;
    }

    parseOrderStatus (status) {
        const statuses = {
            '0': 'open',
            '1': 'canceled',
            '2': 'closed',
            '3': 'open', // partial
        };
        if (status in statuses)
            return statuses[status];
        return status;
    }

    getCreateDateField () {
        return 'trade_date';
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'][api];
        if (api === 'public') {
            url += '/' + this.version + '/' + path;
            if (Object.keys (params).length)
                url += '?' + this.urlencode (params);
        } else {
            let query = this.keysort (this.extend ({
                'method': path,
                'accesskey': this.apiKey,
            }, params));
            let nonce = this.nonce ();
/*
            let query = this.keysort (this.extend ({
                'accesskey': this.apiKey,
                'method': path,
            }, params));
            let auth = this.rawencode (query) + '&secret_key=' + this.secret;
*/
            query = this.keysort (query);
            let auth = this.rawencode (query);
            let secret = this.hash (this.encode (this.secret), 'sha1');
            let signature = this.hmac (this.encode (auth), this.encode (secret), 'md5');
            let suffix = 'sign=' + signature + '&reqTime=' + nonce.toString ();
            
            url += '/' + path + '?' + auth + '&' + suffix;
            console.log("End of sign...");
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (httpCode, reason, url, method, headers, body) {
        if (typeof body !== 'string')
            return; // fallback to default error handler
        if (body.length < 2)
            return; // fallback to default error handler
        if (body[0] === '{') {
            let response = JSON.parse (body);
            if ('code' in response) {
                let error = this.safeString (response, 'code');
                let message = this.id + ' ' + this.json (response);
                if (error in this.exceptions) {
                    let ExceptionClass = this.exceptions[error];
                    throw new ExceptionClass (message);
                } else if (error !== '1000') {
                    throw new ExchangeError (message);
                }
            }
        }
    }
/*
    async request (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let response = await this.fetch2 (path, api, method, params, headers, body);
        if (api === 'private')
            if ('code' in response && response.code != 1000)
                throw new ExchangeError (this.id + ' ' + this.json (response));
        return response;
    }
*/

};
