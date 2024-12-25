const { ethers } = require("hardhat");
const Secret = require("../configs/secret.json")

async function main() {
  
  const runner = Secret.ETHER_DEV_ADDRESS
  console.log(runner)
  const spark = await ethers.deployContract("SparkDev", [runner]);
  await spark.waitForDeployment();

  console.log(`
    Contract Address : ${spark.target}
    Owner: ${runner}
  `);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
