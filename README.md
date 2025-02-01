# BrightMint

A decentralized platform for minting and sharing bright ideas on the Stacks blockchain.

## Overview
BrightMint allows users to:
- Mint their ideas as unique NFTs
- Add metadata like title, description, and tags
- Transfer idea ownership 
- Like and comment on ideas
- Earn rewards for popular ideas

## Features

### Idea Minting
- Create unique NFTs representing your ideas
- Add title and description
- Track creation timestamp and creator information

### Social Interactions
- Like other users' ideas
- Add comments (up to 20 per idea)
- Comment length limited to 280 characters

### Rewards System
- Earn rewards based on likes received
- One reward token per like
- Rewards tracked in global pool
- Claim rewards as idea owner

### Ownership Management
- Transfer idea ownership to other users
- Track ownership history
- Maintain creator attribution

## Getting Started
1. Clone the repository
2. Install clarinet
3. Run tests: `clarinet test`
4. Deploy locally: `clarinet console`

## Smart Contract Interface

### Public Functions
- `mint-idea`: Create new idea NFT
- `transfer-idea`: Transfer ownership
- `like-idea`: Like an existing idea
- `add-comment`: Comment on an idea
- `claim-rewards`: Claim accumulated rewards

### Read-Only Functions
- `get-token-metadata`: Get idea details
- `get-token-owner`: Check current owner
- `get-token-comments`: Get idea comments
- `get-reward-pool`: Check total rewards available
