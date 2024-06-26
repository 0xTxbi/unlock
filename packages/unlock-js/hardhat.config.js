/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomicfoundation/hardhat-ethers')

module.exports = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
}
