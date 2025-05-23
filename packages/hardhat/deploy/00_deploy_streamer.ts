import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Streamer } from "../typechain-types";

/**
 * Deploys a contract named "Streamer" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployStreamer: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Streamer", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // *Checkpoint 1*
  // Get the deployed contract
  const streamer: Streamer = await hre.ethers.getContract("Streamer", deployer);

  // Transfer ownership to your front end address
  console.log("\n 🤹  Sending ownership to frontend address...\n");
  const ownerTx = await streamer.transferOwnership("0x4b2b0D5eE2857fF41B40e3820cDfAc8A9cA60d9f");
  console.log("\n       confirming...\n");
  const ownershipResult = await ownerTx.wait();
  if (ownershipResult) {
    console.log("       ✅ ownership transferred successfully!\n");
  }
};

export default deployStreamer;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Streamer
deployStreamer.tags = ["Streamer"];
