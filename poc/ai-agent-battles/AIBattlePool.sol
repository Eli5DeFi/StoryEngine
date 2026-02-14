// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIBattlePool
 * @notice Betting pools for AI agent story battles
 * @dev Multiple AI agents write competing chapter versions, readers bet on best
 * 
 * Flow:
 * 1. Oracle creates battle with 3-5 AI agents
 * 2. Each agent writes chapter version (off-chain)
 * 3. Users bet USDC on their favorite version
 * 4. After deadline, oracle resolves with winning agent
 * 5. Winners claim payout (parimutuel distribution)
 * 
 * Fee structure:
 * - 85% to winners (parimutuel split)
 * - 10% to treasury
 * - 5% to dev fund
 * 
 * Agent reputation:
 * - Winning agent earns XP
 * - XP unlocks perks (write 2 versions, become Master Agent)
 */
contract AIBattlePool is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    
    struct AIAgent {
        string id;              // "gpt-4", "claude-sonnet-4", "custom-finetune"
        string name;            // "GPT-4", "Claude Sonnet", "Community AI"
        string provider;        // "OpenAI", "Anthropic", "Custom"
        uint256 totalBattles;   // Lifetime battles participated
        uint256 battlesWon;     // Lifetime wins
        uint256 totalPoolSize;  // Total USDC bet on this agent (all-time)
        uint256 reputationXP;   // 0-1000 (increases with wins)
        uint256 lastBattleId;   // Track participation
    }
    
    struct Battle {
        uint256 id;
        uint256 chapterId;
        string[] agentIds;                          // Array of agent IDs competing
        mapping(string => string) chapterHashes;    // agentId => IPFS hash of their chapter
        mapping(string => uint256) pools;           // agentId => USDC bet on them
        mapping(address => mapping(string => uint256)) bets; // user => agent => amount
        uint256 deadline;
        string winningAgent;
        bool resolved;
        uint256 totalPool;                          // Sum of all pools
        uint256 timestamp;
    }
    
    mapping(uint256 => Battle) public battles;
    mapping(string => AIAgent) public agents;
    
    uint256 public battleCount;
    string[] public registeredAgents;  // List of all agent IDs
    
    // Fee distribution
    uint256 public constant WINNER_PCT = 85;   // 85% to winners
    uint256 public constant TREASURY_PCT = 10; // 10% to treasury
    uint256 public constant DEV_PCT = 5;       // 5% to dev
    
    address public treasury;
    address public devFund;
    
    // Reputation thresholds
    uint256 public constant MASTER_AGENT_XP = 500;  // Write 2 versions
    uint256 public constant LEGEND_AGENT_XP = 800;  // Train derivatives
    
    event BattleCreated(
        uint256 indexed battleId,
        uint256 indexed chapterId,
        string[] agentIds,
        uint256 deadline
    );
    
    event AgentRegistered(
        string indexed agentId,
        string name,
        string provider
    );
    
    event BetPlaced(
        uint256 indexed battleId,
        address indexed bettor,
        string agentId,
        uint256 amount
    );
    
    event BattleResolved(
        uint256 indexed battleId,
        string winningAgent,
        uint256 totalPool,
        uint256 winningPool
    );
    
    event PayoutClaimed(
        uint256 indexed battleId,
        address indexed user,
        string agentId,
        uint256 amount
    );
    
    event AgentReputationUpdated(
        string indexed agentId,
        uint256 newXP,
        uint256 battlesWon
    );
    
    constructor(
        address _usdc,
        address _treasury,
        address _devFund
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        require(_devFund != address(0), "Invalid dev fund");
        
        usdc = IERC20(_usdc);
        treasury = _treasury;
        devFund = _devFund;
    }
    
    /**
     * @notice Register a new AI agent
     * @param agentId Unique identifier (e.g., "gpt-4")
     * @param name Display name (e.g., "GPT-4")
     * @param provider Provider name (e.g., "OpenAI")
     */
    function registerAgent(
        string calldata agentId,
        string calldata name,
        string calldata provider
    ) external onlyOwner {
        require(bytes(agents[agentId].id).length == 0, "Agent already registered");
        
        agents[agentId] = AIAgent({
            id: agentId,
            name: name,
            provider: provider,
            totalBattles: 0,
            battlesWon: 0,
            totalPoolSize: 0,
            reputationXP: 0,
            lastBattleId: 0
        });
        
        registeredAgents.push(agentId);
        
        emit AgentRegistered(agentId, name, provider);
    }
    
    /**
     * @notice Create new AI battle
     * @param chapterId Chapter being written
     * @param agentIds Array of competing agent IDs
     * @param chapterHashes IPFS hashes of each agent's chapter
     * @param durationHours Battle duration in hours
     */
    function createBattle(
        uint256 chapterId,
        string[] calldata agentIds,
        string[] calldata chapterHashes,
        uint256 durationHours
    ) external onlyOwner returns (uint256) {
        require(agentIds.length >= 2, "Need at least 2 agents");
        require(agentIds.length <= 5, "Max 5 agents");
        require(agentIds.length == chapterHashes.length, "Mismatch arrays");
        require(durationHours >= 24 && durationHours <= 168, "24h-168h only");
        
        uint256 battleId = battleCount++;
        Battle storage battle = battles[battleId];
        
        battle.id = battleId;
        battle.chapterId = chapterId;
        battle.deadline = block.timestamp + (durationHours * 1 hours);
        battle.resolved = false;
        battle.totalPool = 0;
        battle.timestamp = block.timestamp;
        
        // Store agent IDs and chapter hashes
        for (uint256 i = 0; i < agentIds.length; i++) {
            string memory agentId = agentIds[i];
            require(bytes(agents[agentId].id).length > 0, "Agent not registered");
            
            battle.agentIds.push(agentId);
            battle.chapterHashes[agentId] = chapterHashes[i];
            
            // Update agent stats
            agents[agentId].totalBattles++;
            agents[agentId].lastBattleId = battleId;
        }
        
        emit BattleCreated(battleId, chapterId, agentIds, battle.deadline);
        
        return battleId;
    }
    
    /**
     * @notice Place bet on an AI agent
     * @param battleId Battle identifier
     * @param agentId Agent ID to bet on
     * @param amount USDC amount to bet
     */
    function placeBet(
        uint256 battleId,
        string calldata agentId,
        uint256 amount
    ) external nonReentrant {
        Battle storage battle = battles[battleId];
        
        require(block.timestamp < battle.deadline, "Betting closed");
        require(!battle.resolved, "Battle resolved");
        require(amount > 0, "Amount must be > 0");
        require(bytes(battle.chapterHashes[agentId]).length > 0, "Agent not in battle");
        
        // Transfer USDC from user
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Record bet
        battle.pools[agentId] += amount;
        battle.bets[msg.sender][agentId] += amount;
        battle.totalPool += amount;
        
        // Update agent all-time stats
        agents[agentId].totalPoolSize += amount;
        
        emit BetPlaced(battleId, msg.sender, agentId, amount);
    }
    
    /**
     * @notice Resolve battle - determine winning agent
     * @param battleId Battle to resolve
     * @param winningAgentId Agent that won
     * @dev Called by oracle after voting period
     */
    function resolveBattle(
        uint256 battleId,
        string calldata winningAgentId
    ) external onlyOwner nonReentrant {
        Battle storage battle = battles[battleId];
        
        require(block.timestamp >= battle.deadline, "Betting still open");
        require(!battle.resolved, "Already resolved");
        require(bytes(battle.chapterHashes[winningAgentId]).length > 0, "Invalid agent");
        require(battle.totalPool > 0, "No bets placed");
        
        battle.winningAgent = winningAgentId;
        battle.resolved = true;
        
        uint256 winningPool = battle.pools[winningAgentId];
        
        // Update winning agent reputation
        AIAgent storage agent = agents[winningAgentId];
        agent.battlesWon++;
        
        // XP = (pool size / 1000) * win streak bonus
        uint256 xpGain = (winningPool / 1000);
        if (agent.battlesWon > 1) {
            // Streak bonus: +10% per consecutive win
            xpGain = (xpGain * (100 + (agent.battlesWon * 10))) / 100;
        }
        
        agent.reputationXP += xpGain;
        if (agent.reputationXP > 1000) {
            agent.reputationXP = 1000; // Cap at 1000
        }
        
        emit BattleResolved(battleId, winningAgentId, battle.totalPool, winningPool);
        emit AgentReputationUpdated(winningAgentId, agent.reputationXP, agent.battlesWon);
    }
    
    /**
     * @notice Claim payout for winning bet
     * @param battleId Battle identifier
     * @param agentId Agent you bet on
     */
    function claimPayout(
        uint256 battleId,
        string calldata agentId
    ) external nonReentrant {
        Battle storage battle = battles[battleId];
        
        require(battle.resolved, "Battle not resolved");
        require(
            keccak256(bytes(battle.winningAgent)) == keccak256(bytes(agentId)),
            "Not winning agent"
        );
        
        uint256 userBet = battle.bets[msg.sender][agentId];
        require(userBet > 0, "No bet found");
        
        // Mark as claimed
        battle.bets[msg.sender][agentId] = 0;
        
        // Calculate payout (parimutuel)
        uint256 winningPool = battle.pools[agentId];
        uint256 winnerShare = (battle.totalPool * WINNER_PCT) / 100;
        
        // User's share = (userBet / winningPool) * winnerShare
        uint256 payout = (userBet * winnerShare) / winningPool;
        
        require(usdc.transfer(msg.sender, payout), "Transfer failed");
        
        emit PayoutClaimed(battleId, msg.sender, agentId, payout);
    }
    
    /**
     * @notice Distribute fees to treasury and dev fund
     * @param battleId Battle to collect fees from
     */
    function distributeFees(uint256 battleId) external onlyOwner nonReentrant {
        Battle storage battle = battles[battleId];
        
        require(battle.resolved, "Battle not resolved");
        
        uint256 treasuryFee = (battle.totalPool * TREASURY_PCT) / 100;
        uint256 devFee = (battle.totalPool * DEV_PCT) / 100;
        
        require(usdc.transfer(treasury, treasuryFee), "Treasury transfer failed");
        require(usdc.transfer(devFund, devFee), "Dev transfer failed");
    }
    
    /**
     * @notice Get battle details
     */
    function getBattle(uint256 battleId) external view returns (
        uint256 id,
        uint256 chapterId,
        string[] memory agentIds,
        uint256[] memory agentPools,
        uint256 deadline,
        string memory winningAgent,
        bool resolved,
        uint256 totalPool
    ) {
        Battle storage battle = battles[battleId];
        
        uint256[] memory pools = new uint256[](battle.agentIds.length);
        for (uint256 i = 0; i < battle.agentIds.length; i++) {
            pools[i] = battle.pools[battle.agentIds[i]];
        }
        
        return (
            battle.id,
            battle.chapterId,
            battle.agentIds,
            pools,
            battle.deadline,
            battle.winningAgent,
            battle.resolved,
            battle.totalPool
        );
    }
    
    /**
     * @notice Get user's bet on specific agent
     */
    function getUserBet(
        uint256 battleId,
        address user,
        string calldata agentId
    ) external view returns (uint256) {
        return battles[battleId].bets[user][agentId];
    }
    
    /**
     * @notice Get agent chapter hash
     */
    function getChapterHash(
        uint256 battleId,
        string calldata agentId
    ) external view returns (string memory) {
        return battles[battleId].chapterHashes[agentId];
    }
    
    /**
     * @notice Get agent stats
     */
    function getAgent(string calldata agentId) external view returns (
        string memory id,
        string memory name,
        string memory provider,
        uint256 totalBattles,
        uint256 battlesWon,
        uint256 winRate,
        uint256 totalPoolSize,
        uint256 reputationXP
    ) {
        AIAgent memory agent = agents[agentId];
        
        uint256 winRatePct = agent.totalBattles > 0 
            ? (agent.battlesWon * 100) / agent.totalBattles 
            : 0;
        
        return (
            agent.id,
            agent.name,
            agent.provider,
            agent.totalBattles,
            agent.battlesWon,
            winRatePct,
            agent.totalPoolSize,
            agent.reputationXP
        );
    }
    
    /**
     * @notice Get all registered agents
     */
    function getAllAgents() external view returns (string[] memory) {
        return registeredAgents;
    }
    
    /**
     * @notice Check if agent has unlocked perks
     */
    function getAgentPerks(string calldata agentId) external view returns (
        bool canWriteTwoVersions,
        bool canTrainDerivatives
    ) {
        AIAgent memory agent = agents[agentId];
        
        return (
            agent.reputationXP >= MASTER_AGENT_XP,
            agent.reputationXP >= LEGEND_AGENT_XP
        );
    }
}
