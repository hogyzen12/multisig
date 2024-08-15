# Solana Multisig Wallet Example

This project demonstrates how to create and use a multisig wallet on the Solana blockchain. A multisig (multi-signature) wallet is a type of digital wallet that requires multiple approvals before executing a transaction, providing an extra layer of security for managing funds.

## Why is this useful?

Multisig wallets are crucial for:
1. Enhanced security: Multiple parties must approve transactions, reducing the risk of unauthorized access.
2. Shared responsibility: Ideal for organizations where multiple individuals need to agree on fund movements.
3. Safeguarding large amounts: Provides an additional layer of protection for substantial holdings.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 12 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Solana CLI tools](https://docs.solana.com/cli/install-solana-cli-tools)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/your-username/solana-multisig-example.git
   cd solana-multisig-example
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your Solana keypairs:
   - If you don't have Solana keypairs, create them using the Solana CLI:
     ```
     solana-keygen new --outfile ~/.config/solana/my-keypair.json
     ```
   - Create three keypairs: one for the payer and two for additional signers.

4. Fund your keypairs:
   - Use the Solana CLI to airdrop SOL to your keypairs on devnet:
     ```
     solana airdrop 1 YOUR_PUBLIC_KEY --url devnet
     ```
   - Repeat this for each of your keypairs.

5. Update the `example.js` file:
   - Replace the keypair file paths with your own:
     ```javascript
     const payer = loadKeypairFromFile('/path/to/your/payer-keypair.json');
     const signerTwo = loadKeypairFromFile('/path/to/your/signer-two-keypair.json');
     const signerThree = loadKeypairFromFile('/path/to/your/signer-three-keypair.json');
     ```
   - Update the `withdrawalDestination` if needed:
     ```javascript
     const withdrawalDestination = new PublicKey("YOUR_WITHDRAWAL_DESTINATION_PUBLIC_KEY");
     ```

## Running the Example

Execute the script with:
```
node example.js
```

## What the Code Does

1. **Initialization**: 
   - Connects to Solana devnet
   - Loads keypairs for the payer and signers

2. **Multisig Creation**:
   - Checks if a multisig wallet already exists
   - If not, creates a new 2-of-3 multisig wallet

3. **Deposit**:
   - Deposits 0.0042 SOL into the multisig wallet

4. **Transaction Creation**:
   - Creates a transaction to withdraw 0.001 SOL from the multisig wallet

5. **Approval Process**:
   - Signer One (payer) creates and signs the transaction
   - Signer Two rejects the transaction
   - Signer Three approves the transaction

6. **Execution**:
   - Attempts to execute the transaction (succeeds with 2/3 approvals)

7. **Balance Checks**:
   - Displays final balances of all involved accounts

## Understanding the Logs

The script provides detailed logs to help you understand each step of the process:

- **Keypair Information**: Shows the public keys of all signers involved.
- **Multisig Creation**: Displays the multisig wallet's public key and creation transaction signature.
- **Balance Updates**: Shows the multisig wallet's balance before and after deposits/withdrawals.
- **Transaction Statuses**: Provides status updates for each transaction (creation, approval, rejection, execution).
- **Error Logs**: If any errors occur, they will be displayed with detailed information to help with debugging.

## Troubleshooting

- **Insufficient Balance Errors**: Ensure your keypairs have enough SOL. Use the Solana CLI to airdrop more if needed.
- **Transaction Failures**: Check the logs for specific error messages. Common issues include insufficient funds or incorrect account permissions.
- **RPC Errors**: If you encounter RPC-related errors, try switching to a different devnet RPC endpoint.

## Educational Value

This example demonstrates:
1. How to interact with the Solana blockchain using JavaScript
2. The process of creating and managing a multisig wallet
3. The mechanics of transaction approval in a multisig setup
4. How to use the Solana web3.js library for blockchain interactions

By studying and modifying this code, you can gain practical experience with Solana development and understand the fundamentals of multisig operations on the blockchain.

## Next Steps

- Try modifying the approval threshold or number of signers
- Implement additional features like token transfers or program invocations
- Explore how to integrate this into a full-fledged dApp

Remember, this is a devnet example. For real-world applications, always use thorough testing and security measures, especially when dealing with mainnet and real funds.