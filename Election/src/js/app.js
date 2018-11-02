App = {
    web3Provider: null,
    contracts: {},
    account: "0x0",
    hasVoted: false,
    rendering: false,

    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== "undefined") {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided.
            App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
            web3 = new Web3(App.web3Provider);
        }

        return App.initContract();
    },

    initContract: function() {
        $.getJSON("Election.json", election => {
            // Instantiate a new truffle contract from the artifact.
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract.
            App.contracts.Election.setProvider(App.web3Provider);

            // Make sure we're listening for events.
            App.listenForEvents();

            return App.render();
        });
    },

    listenForEvents: async function() {
        let electionInstance = await App.contracts.Election.deployed();
        electionInstance.votedEvent({}, { fromBlock: "latest" }).watch((err, event) => {
            console.log(`Event triggered: ${event.event}`, event);
            App.render();
        });
    },

    render: async function() {
        if (App.rendering) return;

        App.rendering = true;
        let loader = $("#loader");
        let content = $("#content");

        loader.show();
        content.hide();

        try {
            await App.web3Provider.enable();

            // Load account data.
            web3.eth.getCoinbase((err, account) => {
                if (err === null) {
                    App.account = account;
                    $("#accountAddress").html(`Your Account: ${account}`);
                }
            });

            // Load contract data.
            let electionInstance = await App.contracts.Election.deployed();
            let count = await electionInstance.candidatesCount();

            let candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            let candidatesSelect = $("#candidatesSelect");
            candidatesSelect.empty();

            for (let i = 1; i <= count; i++) {
                electionInstance.candidates(i).then(candidate => {
                    let id = candidate[0];
                    let name = candidate[1];
                    let voteCount = candidate[2];

                    // Render candidate result.
                    let candidateTemplate = `<tr><th>${id}</th><td>${name}</td><td>${voteCount}</td></tr>`;
                    candidatesResults.append(candidateTemplate);

                    // Render candidate ballot option.
                    let candidateOption = `<option value='${id}'>${name}</option>`;
                    candidatesSelect.append(candidateOption);
                });
            }

            let hasVoted = await electionInstance.voters(App.account);
            if (hasVoted) {
                $("form").hide();
            }

            loader.hide();
            content.show();

            App.rendering = false;
        } catch (err) {
            console.error(err);
        }
    },

    castVote: async function() {
        try {
            let candidateId = $("#candidatesSelect").val();
            let electionInstance = await App.contracts.Election.deployed();
            let receipt = await electionInstance.vote(candidateId, { from: App.account });
            $("#content").hide();
            $("#loader").show();
        } catch (err) {
            consoler.error(err);
        }
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});
