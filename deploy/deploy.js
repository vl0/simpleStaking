const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners() // deployer account is the first account for the list of account provided by local eth node
    console.log("Deploying contract with the account:", deployer.address)

    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20")
    const stakingToken = await SimpleERC20.deploy("Staking Token", "STK")
    const rewardToken = await SimpleERC20.deploy("Reward Token", "RWD")

    await stakingToken.deployed()
    await rewardToken.deployed()

    // Log the addresses of the staking and reward tokens
    console.log("Staking Token deployed at:", stakingToken.address)
    console.log("Reward Token deployed at:", rewardToken.address)

    const initialRewardRate = ethers.utils.parseEther("0.1") // define the initial reward rate; parser ether converts to appropriate format
    const StakingContract = await ethers.getContractFactory("StakingContract")
    const stakingContract = await StakingContract.deploy(
        stakingToken.address,
        rewardToken.address,
        initialRewardRate
    )
    await stakingContract.deployed()
    console.log("StakingContract deployed at:", stakingContract.address) // logs address of staking contract
    // Transfer some reward tokens to the StakingContract
    const rewardsAmount = ethers.utils.parseEther("1000")
    await rewardToken.transfer(stakingContract.address, rewardsAmount)
    console.log("Transferred", rewardsAmount.toString(), "RWD to the StakingContract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
