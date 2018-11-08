let DappToken = artifacts.require("./DappToken.sol");
let DappTokenSale = artifacts.require("./DappTokenSale.sol");

contract("DappTokenSale", accounts => {
    let tokenInstance;
    let tokenSaleInstance;

    DappToken.deployed().then(instance => (tokenInstance = instance));
    DappTokenSale.deployed().then(instance => (tokenSaleInstance = instance));

    let tokenPrice = 1000000000000000; // Converts to 0.001 Ether.
    let admin = accounts[0];
    let buyer = accounts[1];
    let tokensAvailable = 750000;
    let numberOfTokens = 10;
    let value = numberOfTokens * tokenPrice; // Total value in wei.

    it("initializes the contract with the correct values", async () => {
        let address = await tokenSaleInstance.address;
        assert.notEqual(address, 0x0, "invalid contract address");

        let tokenContract = await tokenSaleInstance.tokenContract();
        assert.notEqual(tokenContract, 0x0, "invalid token contract address");

        let price = await tokenSaleInstance.tokenPrice();
        assert.equal(price, tokenPrice, "token price is incorrect");
    });

    it("facilitates token buying", async () => {
        // Provision 75% of all tokens to the token sale.
        await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });

        let receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: value });
        assert.equal(receipt.logs.length, 1, "should have triggered one event");
        assert.equal(receipt.logs[0].event, "Sell", "should have been a 'Sell' event");
        assert.equal(receipt.logs[0].args._buyer, buyer, "event has incorrect purchaser account (account 1)");
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, "event has incorrect number of tokens purchased");

        let tokensSold = await tokenSaleInstance.tokensSold();
        assert.equal(tokensSold.toNumber(), numberOfTokens, "incorrect number of tokens sold");

        let buyerBalance = await tokenInstance.balanceOf(buyer);
        assert.equal(buyerBalance.toNumber(), numberOfTokens, "incorrect token balance for buyer");

        let availableBalance = await tokenInstance.balanceOf(tokenSaleInstance.address);
        assert.equal(availableBalance.toNumber(), tokensAvailable - numberOfTokens, "incorrect token balance in contract");

        // Try to buy tokens different from the Ether value.
        try {
            await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
            throw Error("msg.value must be equal to number of tokens in wei");
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "did not issue a revert [value != correct price]");
        }

        // Try to buy more tokens than the sale contract has.
        try {
            await tokenSaleInstance.buyTokens(800000, { from: buyer, value: value });
            throw Error("cannot buy more tokens than the available amount");
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "did not issue a revert [amount > available]");
        }
    });

    it("ends token sale", async () => {
        // Try to end sale other than the admin.
        try {
            await tokenSaleInstance.endSale({ from: buyer });
            throw error("must be an admin to end sale");
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "did not issue a revert [not an admin]");
        }

        let receipt = await tokenSaleInstance.endSale({ from: admin });
        let balance = await tokenInstance.balanceOf(admin);
        assert.equal(balance.toNumber(), 999990, "should have returned unsold tokens to admin");

        // Check that token contract is not accessible anymore when selfDestruct was called.
        try {
            let price = await tokenSaleInstance.tokenPrice();
        } catch (error) {
            assert(error.message.indexOf("not a contract address") >= 0, "contract did not self destruct");
        }
    });
});
