// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Campaign.sol";

contract CampaignFactory {
    address[] public campaigns;

    event CampaignCreated(address indexed campaignAddress, address indexed ngo, address indexed beneficiary);

    function createCampaign(
        address _ngo,
        address _beneficiary,
        string memory _title,
        string memory _description,
        uint _goalAmount,
        uint _deadline,
        Campaign.CampaignType _type,
        string[] memory milestoneNames,
        string[] memory milestoneDescriptions,
        uint[] memory milestoneAmounts,
        uint _recurringWithdrawCap,
        uint _recurringPeriod
    ) external returns (address) {
        // Deadline check
        if (_type == Campaign.CampaignType.AllOrNothing) {
            require(_deadline > block.timestamp, "Deadline must be in the future for AllOrNothing");
        } else {
            require(_deadline == 0, "Deadline must be 0 for non-AllOrNothing campaigns");
        }

        // Milestone validation
        if (_type == Campaign.CampaignType.Milestone) {
            require(
                milestoneNames.length == milestoneAmounts.length &&
                milestoneNames.length == milestoneDescriptions.length &&
                milestoneNames.length > 0,
                "Invalid milestone setup"
            );
        } else {
            require(
                milestoneNames.length == 0 &&
                milestoneDescriptions.length == 0 &&
                milestoneAmounts.length == 0,
                "Non-milestone campaign should not have milestones"
            );
        }

        Campaign newCampaign = new Campaign(
            _ngo,
            _beneficiary,
            _title,
            _description,
            _goalAmount,
            _deadline,
            _type,
            milestoneNames,
            milestoneDescriptions,
            milestoneAmounts,
            _recurringWithdrawCap,
            _recurringPeriod
        );
        campaigns.push(address(newCampaign));
        emit CampaignCreated(address(newCampaign), _ngo, _beneficiary);
        return address(newCampaign);
    }

    function getCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}
