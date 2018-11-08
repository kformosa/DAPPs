pragma solidity ^"0.4.24";

contract DappToken {
    string public constant name = "DApp Token";
    string public constant symbol = "DAPP";
    string public constant standard = "DApp Token v1.0";

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    constructor(uint256 _initialSupply) public {
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Require that the caller account has enough tokens.
        require(balanceOf[msg.sender] >= _value);

        // Actual transfer of tokens.
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        // Trigger event.
        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) { 
        // Add value amount to the spender allowance for delegated transfer.
        allowance[msg.sender][_spender] += _value;

        // Trigger event.
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function getAllowanceRemaining(address _spender) public view returns (uint256 value) {
        return allowance[msg.sender][_spender];
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Validations to check if transaction can continue or not.
        require(balanceOf[_from] >= _value);        
        require(allowance[_from][msg.sender] >= _value);

        // Actual transfer of tokens.
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        // Decrease the value from the approved amount.
        allowance[_from][msg.sender] -= _value;

        // Trigger transfer event.
        emit Transfer(_from, _to, _value);

        return true;
    }
}
