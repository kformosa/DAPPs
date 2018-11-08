let DappToken = artifacts.require("./DappToken.sol");

contract("DappToken", accounts => {
    let tokenInstance;
    DappToken.deployed().then(instance => (tokenInstance = instance));

    it("initializes the contract with the correct values", async () => {
        let name = await tokenInstance.name();
        assert.equal(name, "DApp Token", "incorrect token name");
        let symbol = await tokenInstance.symbol();
        assert.equal(symbol, "DAPP", "incorrect or missing symbol");
        let standard = await tokenInstance.standard();
        assert.equal(standard, "DApp Token v1.0", "incorrect/unexpected standard used");
    });

    it("allocates the initial supply upon deployment", async () => {
        let totalSupply = await tokenInstance.totalSupply();
        assert.equal(totalSupply.toNumber(), 1000000, "checks the total supply of tokens.");

        let adminBalance = await tokenInstance.balanceOf(accounts[0]);
        assert.equal(adminBalance.toNumber(), 1000000, "incorrect allocation to account[0]");
    });

    it("transfers token ownership", async () => {
        tokenInstance.transfer
            .call(accounts[1], 99999999)
            .then(assert.fail)
            .catch(error => assert(error.message.indexOf("revert") >= 0, "did not issue a revert [value > balance]"));

        // Not an actual transaction - just to inspect return value.
        let success = await tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
        assert(success, "function call should have returned 'true'");

        let receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, "should have triggered one event");
        assert.equal(receipt.logs[0].event, "Transfer", "should have been a 'Transfer' event");
        assert.equal(receipt.logs[0].args._from, accounts[0], "event has incorrect from account (account 0)");
        assert.equal(receipt.logs[0].args._to, accounts[1], "event has incorrect to account (account 1)");
        assert.equal(receipt.logs[0].args._value, 250000, "event has incorrect transferred value");

        let toBalance = await tokenInstance.balanceOf(accounts[1]);
        assert.equal(toBalance.toNumber(), 250000, "incorrect balance in receiving account[1]");

        let fromBalance = await tokenInstance.balanceOf(accounts[0]);
        assert.equal(fromBalance.toNumber(), 750000, "incorrect balance in sending account[0]");
    });

    it("approves tokens for delegated transfer", async () => {
        let success = await tokenInstance.approve.call(accounts[1], 100);
        assert(success, "'approve' function should have returned 'true'");

        let receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, "should have triggered one event");
        assert.equal(receipt.logs[0].event, "Approval", "should have been an 'Approval' event");
        assert.equal(receipt.logs[0].args._owner, accounts[0], "event has incorrect ownership account (account 0)");
        assert.equal(receipt.logs[0].args._spender, accounts[1], "event has incorrect spender account (account 1)");
        assert.equal(receipt.logs[0].args._value, 100, "event has incorrect approved value");

        let allowance = await tokenInstance.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 100, "incorrect allowance for delegated transfer - owner: account[0], spender: account[1]");
    });

    it("handles delegated token transfers", async () => {
        let fromAccount = accounts[2];
        let toAccount = accounts[3];
        let spendingAccount = accounts[4];

        // Transfer some tokens to fromAccount.
        await tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
        await tokenInstance.approve(spendingAccount, 15, { from: fromAccount });

        let check = await tokenInstance.getAllowanceRemaining(spendingAccount, { from: fromAccount });
        assert.equal(check.toNumber(), 15, "incorrect remaining allowance");

        // Try to transfer more tokens than owners's account balance.
        try {
            await tokenInstance.transferFrom(fromAccount, toAccount, 999, { from: spendingAccount });
            throw Error("cannot transfer value larger than balance");
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "did not issue a revert [value > balance]");
        }

        // Try to transfer more tokens than the allowance.
        try {
            await tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
            throw Error("cannot transfer value larger than approved amount");
        } catch (error) {
            assert(error.message.indexOf("revert") >= 0, "did not issue a revert [value > approved]");
        }

        let success = await tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
        assert(success, "'transferFrom' function should have returned 'true'");

        // Do actual transfer of 10 tokens.
        let receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
        assert.equal(receipt.logs.length, 1, "should have triggered one event");
        assert.equal(receipt.logs[0].event, "Transfer", "should have been a 'Transfer' event");
        assert.equal(receipt.logs[0].args._from, fromAccount, "event has incorrect from account (fromAccount)");
        assert.equal(receipt.logs[0].args._to, toAccount, "event has incorrect to account (toAccount)");
        assert.equal(receipt.logs[0].args._value, 10, "event has incorrect transferred amount");

        // Final checks of balances.
        let fromAccountBalance = await tokenInstance.balanceOf(fromAccount);
        assert.equal(fromAccountBalance.toNumber(), 90, "incorrect remaining balance (fromAccount)");

        let toAccountBalance = await tokenInstance.balanceOf(toAccount);
        assert.equal(toAccountBalance.toNumber(), 10, "incorrect balance (toAccount)");

        let remainingAllowance = await tokenInstance.allowance(fromAccount, spendingAccount);
        assert.equal(remainingAllowance.toNumber(), 5, "incorrect remaining allowance");
    });
});
