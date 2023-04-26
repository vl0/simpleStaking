// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingContract is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken; // token that is staked in the contract
    IERC20 public rewardToken; // token that is minted as a reward

    //struct that stores the amount and last claim timestamp for each user
    struct StakeInfo {
        uint256 amount;
        uint256 lastClaim;
    }

    uint256 public rewardRate; // reward rate per staked token per day
    mapping(address => StakeInfo) public stakes; //maps adress to struct with corresponding StakeInfo struct

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    // When intialising contract one needs to pass the staking and reward tokens as well as reward rate
    constructor(IERC20 _stakingToken, IERC20 _rewardToken, uint256 _rewardRate) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        rewardRate = _rewardRate;
    }

    //IMPORTANT: In this function, staking new tokens claims rewards
    function stake(uint256 amount) external {
        require(amount > 0, "You dawg, you have to stake something"); // amount staked must be higher than 0

        stakingToken.safeTransferFrom(msg.sender, address(this), amount); //transfers token from address calling the contract to the smart contrac

        StakeInfo storage stakeInfo = stakes[msg.sender];
        _claimReward(msg.sender, stakeInfo);

        stakeInfo.amount += amount; // updates amount with new amount
        stakeInfo.lastClaim = block.timestamp;

        emit Staked(msg.sender, amount); //emits event that tokens have bee staked
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "You dawg, do you want to withdraw or not"); // amount withdrawn must be higher than 0

        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount >= amount, "Not enough token to withdraw dog!"); // Checks if the amount of staked tokens is higher than the amount being withdrwan

        _claimReward(msg.sender, stakeInfo);

        stakeInfo.amount -= amount; //reduces the amount by withdrawn amount
        stakeInfo.lastClaim = block.timestamp;

        stakingToken.safeTransfer(msg.sender, amount); //transfers an amount of tokens to the msg sender

        emit Withdrawn(msg.sender, amount); //emits event that tokens have been withdrawn
    }

    function claimReward() external {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        uint256 reward = _claimReward(msg.sender, stakeInfo);
        stakeInfo.lastClaim = block.timestamp;

        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    function _claimReward(address user, StakeInfo storage stakeInfo) internal returns (uint256) {
        uint256 pendingReward = calculateReward(user);
        if (pendingReward > 0) {
            rewardToken.safeTransfer(user, pendingReward);
        }
        return pendingReward;
    }

    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        uint256 elapsedTime = block.timestamp - stakeInfo.lastClaim; // calculate time of staking epoch
        uint256 pendingReward = (stakeInfo.amount * rewardRate * elapsedTime) / (1 days * 10 ** 18);
        return pendingReward;
    }

    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }

    // In case wrong tokens are sent to smart contract, this allows contract owner to rescue them
    function rescueTokens(IERC20 token, uint256 amount) external onlyOwner {
        require(token != stakingToken, "Cannot rescue staking tokens");
        token.safeTransfer(owner(), amount);
    }
}
