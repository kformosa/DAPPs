pragma solidity ^"0.4.24";

contract Election {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;

    uint public candidatesCount;

    event votedEvent(
        uint indexed candidateId
    );

    constructor() public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }   

    function addCandidate(string _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint _candidateId) public {
        // Check if address hasn't voted before.
        require(!voters[msg.sender]);

        // Check for a valid candidate.
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        // Trigger voted event.
        emit votedEvent(_candidateId);
    }
}