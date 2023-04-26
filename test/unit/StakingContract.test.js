const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("StakingContract", function () {
    let stakingToken, rewardToken, stakingContract, owner, addr1, addr2

    beforeEach(async () => {
        const SimpleERC20 = await ethers.getContractFactory("SimpleERC20")
        stakingToken = await SimpleERC20.deploy("Staking Token", "STK")
        rewardToken = await SimpleERC20.deploy("Reward Token", "RWD")

        const StakingContract = await ethers.getContractFactory("StakingContract")
        const initialRewardRate = ethers.utils.parseEther("0.1")
        stakingContract = await StakingContract.deploy(
            stakingToken.address,
            rewardToken.address,
            initialRewardRate
        )
        ;[owner, addr1, addr2] = await ethers.getSigners()

        // Transfer some tokens to addr1 and addr2 for testing
        await stakingToken.transfer(addr1.address, ethers.utils.parseEther("1000"))
        await stakingToken.transfer(addr2.address, ethers.utils.parseEther("1000"))

        // Transfer some rewards to the staking contract
        await rewardToken.transfer(stakingContract.address, ethers.utils.parseEther("1000"))
    })

    describe("Staking", function () {
        it("should allow users to stake tokens", async function () {
            const stakingAmount = ethers.utils.parseEther("100")

            await stakingToken.connect(addr1).approve(stakingContract.address, stakingAmount)
            await stakingContract.connect(addr1).stake(stakingAmount)

            const stakeInfo = await stakingContract.stakes(addr1.address)
            expect(stakeInfo.amount).to.equal(stakingAmount)
        })
    })

    describe("Withdrawing", function () {
        it("should allow users to withdraw staked tokens", async function () {
            const stakingAmount = ethers.utils.parseEther("100")

            await stakingToken.connect(addr1).approve(stakingContract.address, stakingAmount)
            await stakingContract.connect(addr1).stake(stakingAmount)

            await stakingContract.connect(addr1).withdraw(stakingAmount)

            const stakeInfo = await stakingContract.stakes(addr1.address)
            expect(stakeInfo.amount).to.equal(0)
        })
    })

    describe("Claiming Rewards", function () {
        it("should allow users to claim rewards", async function () {
            const stakingAmount = ethers.utils.parseEther("100")

            await stakingToken.connect(addr1).approve(stakingContract.address, stakingAmount)
            await stakingContract.connect(addr1).stake(stakingAmount)

            await ethers.provider.send("evm_increaseTime", [86400]) // Increase time by 1 day
            await ethers.provider.send("evm_mine")

            const initialRewardBalance = await rewardToken.balanceOf(addr1.address)
            await stakingContract.connect(addr1).claimReward()
            const finalRewardBalance = await rewardToken.balanceOf(addr1.address)

            expect(finalRewardBalance).to.gt(initialRewardBalance)
        })
    })

    describe("Withdrawing more than you have deposited", function () {
        it("should fail", async function () {
            const stakingAmount = ethers.utils.parseEther("100")
            const withdrawAmount = ethers.utils.parseEther("150")

            await stakingToken.connect(addr1).approve(stakingContract.address, stakingAmount)
            await stakingContract.connect(addr1).stake(stakingAmount)

            await stakingContract.connect(addr1).withdraw(withdrawAmount)

            const stakeInfo = await stakingContract.stakes(addr1.address)
            expect(stakeInfo.amount).to.equal(0)
        })
    })
})
