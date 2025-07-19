// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Campaign {
    enum CampaignType { Flexible, Milestone, Recurring, AllOrNothing }
    enum CampaignStatus { Active, Completed, Cancelled }

    address public ngo;
    address public beneficiary;
    string public title;
    string public description;
    CampaignType public campaignType;
    CampaignStatus public status;
    uint public goalAmount;
    uint public totalDonated;
    uint public deadline; // Only for AllOrNothing, 0 otherwise

    // Recurring
    uint public recurringWithdrawCap; // Max withdrawal per period (wei)
    uint public recurringPeriod;      // Period in seconds
    uint public lastWithdrawTime;

    // All-or-Nothing
    bool public fundsClaimed; // To prevent double claims

    struct Milestone {
        string name;
        string description;
        uint amount;
        bool released;
        string proofURI; // Off-chain evidence (optional, e.g., IPFS)
    }
    Milestone[] public milestones;

    mapping(address => uint) public donations;

    event DonationReceived(address indexed donor, uint amount);
    event MilestoneReleased(uint indexed milestoneIndex, uint amount, string proofURI);
    event FundsWithdrawn(uint amount);
    event CampaignCompleted();
    event CampaignCancelled();

    modifier onlyNGO() {
        require(msg.sender == ngo, "Not authorized");
        _;
    }

    modifier onlyActive() {
        require(status == CampaignStatus.Active, "Campaign not active");
        _;
    }

    constructor(
        address _ngo,
        address _beneficiary,
        string memory _title,
        string memory _description,
        uint _goalAmount,
        uint _deadline,
        CampaignType _type,
        string[] memory milestoneNames,
        string[] memory milestoneDescriptions,
        uint[] memory milestoneAmounts,
        uint _recurringWithdrawCap,
        uint _recurringPeriod
    ) {
        ngo = _ngo;
        beneficiary = _beneficiary;
        title = _title;
        description = _description;
        goalAmount = _goalAmount;
        campaignType = _type;
        status = CampaignStatus.Active;

        // Only set deadline for AllOrNothing
        if (_type == CampaignType.AllOrNothing) {
            require(_deadline > block.timestamp, "Deadline must be in the future");
            deadline = _deadline;
        } else {
            deadline = 0;
        }

        if (_type == CampaignType.Recurring) {
            recurringWithdrawCap = _recurringWithdrawCap;
            recurringPeriod = _recurringPeriod;
            lastWithdrawTime = block.timestamp - _recurringPeriod;
        }

        // Milestone validation and creation
        if (_type == CampaignType.Milestone) {
            require(
                milestoneNames.length == milestoneAmounts.length &&
                milestoneNames.length == milestoneDescriptions.length &&
                milestoneNames.length > 0,
                "Invalid milestone setup"
            );
            for (uint i = 0; i < milestoneNames.length; i++) {
                milestones.push(Milestone({
                    name: milestoneNames[i],
                    description: milestoneDescriptions[i],
                    amount: milestoneAmounts[i],
                    released: false,
                    proofURI: ""
                }));
            }
        } else {
            require(
                milestoneNames.length == 0 &&
                milestoneDescriptions.length == 0 &&
                milestoneAmounts.length == 0,
                "Non-milestone campaign should not have milestones"
            );
        }
    }

    function donate() external payable onlyActive {
        require(msg.value > 0, "No ETH sent");
        donations[msg.sender] += msg.value;
        totalDonated += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }

    // Flexible: NGO can withdraw anytime (no auto-complete!)
    function withdrawFlexible(uint amount) external onlyNGO onlyActive {
        require(campaignType == CampaignType.Flexible, "Not flexible funding");
        require(address(this).balance >= amount, "Insufficient funds");
        payable(beneficiary).transfer(amount);
        emit FundsWithdrawn(amount);
        // *** No more auto-complete here! Campaign remains Active even if balance is zero ***
    }

    // New: Manual close for Flexible/any type
    function closeCampaign() external onlyNGO onlyActive {
        status = CampaignStatus.Completed;
        emit CampaignCompleted();
    }

    // Milestone: Only after off-chain proof provided
    function releaseMilestone(uint milestoneIndex, string memory proofURI) external onlyNGO onlyActive {
        require(campaignType == CampaignType.Milestone, "Not milestone-based");
        require(milestoneIndex < milestones.length, "Invalid milestone");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "Already released");
        require(address(this).balance >= m.amount, "Not enough funds");

        m.proofURI = proofURI;
        m.released = true;
        payable(beneficiary).transfer(m.amount);
        emit MilestoneReleased(milestoneIndex, m.amount, proofURI);

        // If all milestones released, mark as completed
        bool allReleased = true;
        for (uint i = 0; i < milestones.length; i++) {
            if (!milestones[i].released) {
                allReleased = false;
                break;
            }
        }
        if (allReleased) {
            markCompleted();
        }
    }

    // Recurring: Withdraw at intervals
    function withdrawRecurring(uint amount) external onlyNGO onlyActive {
        require(campaignType == CampaignType.Recurring, "Not recurring funding");
        require(block.timestamp >= lastWithdrawTime + recurringPeriod, "Withdrawal not yet allowed");
        require(amount <= recurringWithdrawCap, "Amount exceeds cap");
        require(address(this).balance >= amount, "Insufficient funds");

        lastWithdrawTime = block.timestamp;
        payable(beneficiary).transfer(amount);
        emit FundsWithdrawn(amount);

        if (address(this).balance == 0) {
            markCompleted();
        }
    }

    // AllOrNothing: Claim after deadline if goal met
    function claimAllOrNothing() external onlyNGO onlyActive {
        require(campaignType == CampaignType.AllOrNothing, "Not all-or-nothing");
        require(block.timestamp >= deadline, "Campaign not ended");
        require(!fundsClaimed, "Already claimed");
        require(totalDonated >= goalAmount, "Goal not reached");
        require(address(this).balance > 0, "No funds");
        fundsClaimed = true;
        payable(beneficiary).transfer(address(this).balance);
        emit FundsWithdrawn(address(this).balance);
        markCompleted();
    }

    // Refund donors if goal not met (AllOrNothing)
    function refundAllOrNothing() external onlyActive {
        require(campaignType == CampaignType.AllOrNothing, "Not all-or-nothing");
        require(block.timestamp >= deadline, "Campaign not ended");
        require(totalDonated < goalAmount, "Goal reached; cannot refund");
        require(donations[msg.sender] > 0, "No donation to refund");
        uint amount = donations[msg.sender];
        donations[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        if (address(this).balance == 0) {
            markCancelled();
        }
    }

    // Cancel campaign (can only be called by NGO)
    function cancelCampaign() external onlyNGO onlyActive {
        status = CampaignStatus.Cancelled;
        emit CampaignCancelled();
    }

    // Internal: Mark completed
    function markCompleted() internal {
        status = CampaignStatus.Completed;
        emit CampaignCompleted();
    }

    // Internal: Mark cancelled (for refunds)
    function markCancelled() internal {
        status = CampaignStatus.Cancelled;
        emit CampaignCancelled();
    }
}
