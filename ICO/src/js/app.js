App = {
    web3Provider: null,
    contracts: {},
    tokenInstance: null,
    tokenSaleInstance: null,
    adminAccount: "0x85304c4a0be632214c4135a4f9112f18440b1ae6", // First account on my Ganache instance (local network).
    adminInitialTokens: 1000000,
    account: "0x0",
    accountBalance: 0,
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: function() {
        console.log("App initialized...");
        return App.initWeb3();
    },

    initWeb3: async function() {
        if (typeof web3 !== "undefined") {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            await App.web3Provider.enable();
            web3 = new Web3(App.web3Provider);
        } else {
            // Specify default instance if no web3 instance provided.
            App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
            web3 = new Web3(App.web3Provider);
        }

        return App.initContracts();
    },

    initContracts: function() {
        $.getJSON("DappToken.json", dappToken => {
            App.contracts.DappToken = TruffleContract(dappToken);
            App.contracts.DappToken.setProvider(App.web3Provider);

            App.contracts.DappToken.deployed()
                .then(instance => {
                    console.log(`Dapp Token Address: ${instance.address}`);
                    return instance;
                })
                .then(instance => {
                    App.tokenInstance = instance;

                    $.getJSON("DappTokenSale.json", dappTokenSale => {
                        App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
                        App.contracts.DappTokenSale.setProvider(App.web3Provider);

                        App.contracts.DappTokenSale.deployed().then(instance => {
                            App.tokenSaleInstance = instance;
                            console.log(`Dapp Token Sale Address: ${instance.address}`);

                            // Note: use only for local network (accounts will change)!
                            /* App.checkBalances(); */

                            App.listenForEvents();

                            return App.render();
                        });
                    });
                });
        });
    },

    checkBalances: function() {
        App.tokenInstance.balanceOf(App.adminAccount).then(adminBalance => {
            // Check if Token Sale Contract has been provissioned with some tokens.
            if (adminBalance.toNumber() === App.adminInitialTokens) {
                throw new Error("Token Sale contract hasn't been provisioned! Please correct.");
            }
        });
    },

    listenForEvents: function() {
        App.tokenSaleInstance
            .Sell(
                {},
                {
                    fromBlock: 0,
                    toBlock: "latest"
                }
            )
            .watch((error, event) => {
                console.log(`Event triggered: [${event.event}]`);
                App.render();
            });
    },

    render: function() {
        if (App.loading) return;

        App.loading = true;

        let loader = $("#loader");
        let content = $("#content");

        loader.show();
        content.hide();

        // Load account data.
        web3.eth.getCoinbase((err, account) => {
            if (err === null) {
                App.account = account;
                $("#account-address").html(`Your account: ${App.account}`);
            }
        });

        // Load token sale contract.
        App.tokenSaleInstance
            .tokenPrice()
            .then(price => {
                App.tokenPrice = price.toNumber();
                $(".token-price").html(web3.fromWei(App.tokenPrice, "ether"));
                return App.tokenSaleInstance.tokensSold();
            })
            .then(tokensSold => {
                App.tokensSold = tokensSold.toNumber();
                $(".tokens-sold").html(App.tokensSold);
                $(".tokens-available").html(App.tokensAvailable);

                let progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
                $("#progress").css("width", progressPercent + "%");

                return App.tokenInstance.balanceOf(App.account);
            })
            .then(accountBalance => {
                App.accountBalance = accountBalance.toNumber();
                $(".dapp-balance").html(App.accountBalance);

                // Finished - show content now.
                App.loading = false;
                loader.hide();
                content.show();
            });
    },

    buyTokens: function() {
        $("#loader").show();
        $("#content").hide();

        let numberOfTokens = $("#numberOfTokens").val();
        App.tokenSaleInstance
            .buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000 // Gas limit NOT actual gas used (or will be used).
            })
            .then(result => {
                console.log("Tokens bought...");
                $("form").trigger("reset"); // Reset input field in form.

                // Keep loader showing up - wait for the sell event.
            });
    }
};

$(function() {
    $(window).load(() => App.init());
});
