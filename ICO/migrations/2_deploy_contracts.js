var DappToken = artifacts.require("./DappToken.sol");
var DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = function(deployer) {
    let tokenPrice = 1000000000000000; // Converts to 0.001 Ether.

    // Deploy and set initial amount to 1,000,000 tokens.
    deployer.deploy(DappToken, 1000000).then(() => {
        return deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
    });
};
