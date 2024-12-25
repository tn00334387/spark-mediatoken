require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-waffle");
const Secret = require("./configs/secret.json")

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.20",
  networks: {
    // for mainnet
    'ether-mainnet': {
      url: Secret.ALCHEMY_ETHER_ENDPOINT,
      accounts: [Secret.ETHER_DEV_PRIVATE_KEY],
      gasPrice: 1000000000,
    },
    // for testnet
    'ether-sepolia': {
      url: Secret.ALCHEMY_ETHER_ENDPOINT_DEV,
      accounts: [Secret.ETHER_DEV_PRIVATE_KEY],
      gasPrice: 1000000000,
    },
    // for blast-testnet
    'blast_sepolia': {
      url: 'https://sepolia.blast.io',
      accounts: [Secret.ETHER_DEV_PRIVATE_KEY],
      gasPrice: 1000000000,
    }
  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      blast_sepolia: "blast_sepolia", // apiKey is not required, just set a placeholder
      sepolia: Secret.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "blast_sepolia",
        chainId: 168587773,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan",
          browserURL: "https://testnet.blastscan.io"
        }
      }
    ]
  },
  sourcify: { // Disabled by default
    enabled: true // Doesn't need an API key
  },
  paths: {
    tests: "./test"
  }
};
