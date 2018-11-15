/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

require("dotenv").config();
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = process.env["NEMONIC"];
var tokenKey = process.env["ENDPOINT_KEY"];

module.exports = {
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    networks: {
        development: {
            // Ganache
            host: "127.0.0.1",
            port: "7545",
            network_id: "*" // Match any network id
        },
        private: {
            // Local private blockchain running in Geth
            host: "localhost",
            port: 8545,
            network_id: 1234,
            from: "0xd2677f3df226389682f3f05b5fc0322855b4ae3c",
            gas: 500000
        },
        rinkeby: {
            // Rinkeby test network using infura.io
            host: "localhost",
            provider: function() {
                return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/" + tokenKey);
            },
            network_id: 4,
            gas: 700000,
            gasPrice: 1000000000
        }
    }
};
