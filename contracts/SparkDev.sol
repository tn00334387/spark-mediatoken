// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Counters.sol";

interface IBlast {
  function configureClaimableGas() external;
  function claimAllGas(address contractAddress, address recipient) external returns (uint256);
}

contract SparkDev is ERC1155URIStorage, Ownable {

    struct MediaToken {
        address deployer;
        uint256 tokenId;                    
        uint256 supply;                      
        uint256 mintPrice;          
    }

    // IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
    address public protocolDestination;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(bytes32 => MediaToken) public mediaTokens;
    uint256 public tokenShareFee;
    uint256 public maxMintSupply;
    mapping(address => bool) public adminList; 

    event Deploying(address deployer, bytes32 mediaId, uint256 tokenId, string tokenUri, uint256 tokenPrice); 
    event Minting(address miner, bytes32 mediaId, uint256 tokenId, uint256 tokenAmount, uint256 tokenSupply, uint256 ethValue, uint256 ethShareValue); 
    
    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {
        // BLAST.configureClaimableGas(); 
        maxMintSupply = 1000;
        protocolDestination = initialOwner;
    }

    // function claimMyContractsGas() external {
    //     BLAST.claimAllGas(address(this), msg.sender);
    // }

    function setBaseURI(string memory newuri) public onlyOwner {
        _setBaseURI(newuri);
    }

    function setProtocolDestination(address _protocolDestination ) public onlyOwner {
        protocolDestination = _protocolDestination;
    }

    function setTokenShareFee(uint256 _tokenShareFee) public onlyOwner {
        tokenShareFee = _tokenShareFee;
    }

    function setMaxMintSupply(uint256 _maxMintSupply) public onlyOwner {
        maxMintSupply = _maxMintSupply;
    }

    function setTokenUri(bytes32 mediaId, string memory newTokenUri) public onlyOwner {
        require(mediaTokens[mediaId].supply > 0, "The mediaId has not been deployed");
        uint256 tokenId = mediaTokens[mediaId].tokenId;
        _setURI(tokenId, newTokenUri);
    }

    function setAdminList( address _admin ) public onlyOwner {
        adminList[_admin] = true;
    }

    function getCurrentTokenId() public view virtual returns (uint256) {
        uint256 currentTokenId = _tokenIds.current();
        return currentTokenId;
    }

    function deploy(address account, bytes32 mediaId, string memory tokenUri, uint256 tokenPrice )
        public
    {
        require(adminList[msg.sender] == true, "Permission denied");
        require(mediaTokens[mediaId].supply == 0, "The mediaId has been deployed");
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        mediaTokens[mediaId].tokenId = newTokenId;
        mediaTokens[mediaId].supply = 1;
        mediaTokens[mediaId].mintPrice = tokenPrice;
        mediaTokens[mediaId].deployer = account;
        _setURI(newTokenId, tokenUri);
        _mint(account, newTokenId, 1, "");
        emit Deploying(account, mediaId, newTokenId, tokenUri, tokenPrice);
    }

    function mint( bytes32 mediaId, uint256 amount )
        public
        payable 
    {
        uint256 mediaTokenSupply = mediaTokens[mediaId].supply;
        require(mediaTokenSupply > 0, "The mediaId has not been deployed");
        uint256 tokenMintPrice = mediaTokens[mediaId].mintPrice * amount;
        require(msg.value >= tokenMintPrice, "Insufficient funds");
        require(mediaTokenSupply + amount < maxMintSupply, "Max media token supply exceeded");
        mediaTokens[mediaId].supply = mediaTokenSupply + amount;
        uint256 tokenId = mediaTokens[mediaId].tokenId;
        
        address tokenDeployer = mediaTokens[mediaId].deployer;
        uint256 tokenShareFeeValue = tokenMintPrice * tokenShareFee / 1 ether;
        uint256 protocolDestinationValue = msg.value - tokenShareFeeValue;
        _mint(msg.sender, tokenId, amount, "");
        emit Minting(msg.sender, mediaId, tokenId, amount, mediaTokens[mediaId].supply, msg.value, tokenShareFeeValue);
        (bool success1, ) = tokenDeployer.call{value: tokenShareFeeValue}("");
        (bool success2, ) = protocolDestination.call{value: protocolDestinationValue}("");
        require(success1 && success2, "Unable to send funds");
    }

    function mintByAdmin( address account, bytes32 mediaId, uint256 amount )
        public 
    {
        require(adminList[msg.sender] == true, "Permission denied");
        uint256 mediaTokenSupply = mediaTokens[mediaId].supply;
        require(mediaTokenSupply > 0, "The mediaId has not been deployed");
        require(mediaTokenSupply + amount < maxMintSupply, "Max media token supply exceeded");
        mediaTokens[mediaId].supply = mediaTokenSupply + 1;
        uint256 tokenId = mediaTokens[mediaId].tokenId;
        _mint(account, tokenId, amount, "");
        emit Minting(msg.sender, mediaId, tokenId, amount, mediaTokens[mediaId].supply, 0, 0);
    }

}
