const Election = artifacts.require("./Election.sol");

contract("Election", accounts => {
    let electionInstance;

    // Get instance of the Election contract from the blockchain and assign it to a local variable.
    Election.deployed().then(instance => {
        electionInstance = instance;
    });

    it("initializes with two candidates", () => {
        electionInstance.candidatesCount().then(count => {
            assert.equal(count, 2, "expected 2 candidates");
        });
    });

    it("initializes the candidates with the correct values", () => {
        electionInstance.candidates(1).then(candidate => {
            assert.equal(candidate[0], 1, "does not contain the correct id)");
            assert.equal(candidate[1], "Candidate 1", "does not contain the correct name");
            assert.equal(candidate[2], 0, "does not contain the correct vote count");
        });

        electionInstance.candidates(2).then(candidate => {
            assert.equal(candidate[0], 2, "does not contain the correct id");
            assert.equal(candidate[1], "Candidate 2", "does not contain the correct name");
            assert.equal(candidate[2], 0, "does not contain the correct vote count");
        });
    });

    it("allows a voter to cast a vote", async () => {
        let candidateId = 1;
        let receipt = await electionInstance.vote(candidateId, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, "an event was not triggered");
        assert.equal(receipt.logs[0].event, "votedEvent", "the event type is not correct");
        assert.equal(receipt.logs[0].args.candidateId.toNumber(), candidateId, "the event candidate id is not correct");

        let voted = await electionInstance.voters(accounts[0]);
        assert(voted, "the voter was not marked as voted");

        let candidate = await electionInstance.candidates(candidateId);
        assert.equal(candidate[2], 1, "candidate's vote count not incremented");
    });

    it("throws an exception for invalid candidates", () => {
        electionInstance
            .vote(99, { from: accounts[1] })
            .then(assert.fail)
            .catch(err => assert(err.message.indexOf("revert") >= 0, "error message does not contain revert"));

        electionInstance.candidates(1).then(candidate1 => {
            assert.equal(candidate1[2], 1, "candidate 1 incorrectly received a vote");
        });

        electionInstance.candidates(2).then(candidate2 => {
            assert.equal(candidate2[2], 0, "candidate 2 incorrectly received a vote");
        });
    });

    it("throws an exception for double voting", async () => {
        let candidateId = 2;
        let receipt = await electionInstance.vote(candidateId, { from: accounts[1] });
        let candidate = await electionInstance.candidates(candidateId);
        assert.equal(candidate[2], 1, `candidate ${candidateId} didn't get vote`);

        // Try to vote again with account[1].
        electionInstance
            .vote(candidateId, { from: accounts[1] })
            .then(assert.fail)
            .catch(err => assert(err.message.indexOf("revert") >= 0, "error message does not conatin revert"));

        electionInstance.candidates(1).then(candidate1 => {
            assert.equal(candidate1[2], 1, "candidate 1 incorrectly received a vote");
        });

        electionInstance.candidates(2).then(candidate2 => {
            assert.equal(candidate2[2], 1, "candidate 2 incorrectly received a vote");
        });
    });
});
