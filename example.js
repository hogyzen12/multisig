import { MultiSig } from "spl-governance-multisig";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import fs from 'fs';

// Devnet RPC endpoint
const clusterUrl = "https://devnet.helius-rpc.com/?api-key=5adcfebf-b520-4bcd-92ee-b4861e5e7b5b";

const connection = new Connection(clusterUrl, {
  commitment: "confirmed",
});

// Governance program ID
const GOVERNANCE_PROGRAM_ID = new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw");

// Function to load keypair from file
function loadKeypairFromFile(filePath) {
  const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

// Load keypairs
const payer = loadKeypairFromFile('/Users/hogyzen12/.config/solana/pLgH63FULg9BVrqyjFLwDXyiGBFKvtw7HMByv592WMK.json');
const signerOne = payer; // Same as payer
const signerTwo = loadKeypairFromFile('/Users/hogyzen12/.config/solana/6tBou5MHL5aWpDy6cgf3wiwGGK2mR8qs68ujtpaoWrf2.json');
const signerThree = loadKeypairFromFile('/Users/hogyzen12/.config/solana/devDfUnvTUxNCPvW2FgtHsWXJ1YZDv5gUozmyiM8jpM.json');

// Withdrawal destination
const withdrawalDestination = new PublicKey("6tBou5MHL5aWpDy6cgf3wiwGGK2mR8qs68ujtpaoWrf2");

console.log("Using the following public keys:");
console.log("Payer public key:", payer.publicKey.toBase58());
console.log("Signer One public key:", signerOne.publicKey.toBase58());
console.log("Signer Two public key:", signerTwo.publicKey.toBase58());
console.log("Signer Three public key:", signerThree.publicKey.toBase58());
console.log("Withdrawal destination:", withdrawalDestination.toBase58());

// Create MultiSig instances
const payerInstance = new MultiSig(connection, payer);
const signerOneInstance = new MultiSig(connection, signerOne);
const signerTwoInstance = new MultiSig(connection, signerTwo);
const signerThreeInstance = new MultiSig(connection, signerThree);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkTransactionStatus(signature) {
  let status;
  try {
    status = await connection.getSignatureStatus(signature);
    console.log(`Transaction status: ${JSON.stringify(status)}`);
  } catch (error) {
    console.error(`Error checking transaction status: ${error}`);
  }
  return status;
}

async function sendSolToMultiSigWallet(amount, multiSigWallet) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(multiSigWallet),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  const signature = await connection.sendTransaction(transaction, [payer]);
  console.log(`Deposit transaction signature: ${signature}`);
  await checkTransactionStatus(signature);
}

async function findExistingMultisig() {
  try {
    // We'll use the getAllMultisigInfos method if it exists
    if (typeof payerInstance.getAllMultisigInfos === 'function') {
      const multisigs = await payerInstance.getAllMultisigInfos();
      if (multisigs.length > 0) {
        console.log("Existing multisig(s) found:");
        multisigs.forEach((multisig, index) => {
          console.log(`Multisig ${index + 1}:`);
          console.log(`  Key: ${multisig.key.toBase58()}`);
          console.log(`  Wallet: ${multisig.wallet.toBase58()}`);
        });
        return multisigs[0]; // Return the first multisig found
      }
    } else {
      console.log("getAllMultisigInfos method not available. Unable to check for existing multisigs.");
    }
    console.log("No existing multisig found for the payer.");
    return null;
  } catch (error) {
    console.error("Error while checking for existing multisig:", error);
    return null;
  }
}

(async() => {
  try {
    console.log("Checking balances...");
    const payerBalance = await connection.getBalance(payer.publicKey);
    console.log(`Payer balance: ${payerBalance / LAMPORTS_PER_SOL} SOL`);

    // Check if multisig already exists
    let multiSigKey, multiSigWallet;
    const existingMultisig = await findExistingMultisig();

    if (existingMultisig) {
      console.log("Using existing multisig");
      multiSigKey = existingMultisig.key;
      multiSigWallet = existingMultisig.wallet;
    } else {
      console.log("No existing multisig found. Creating a new one.");
      // Create 2-of-3 Multi Sig Wallet
      console.log("Creating 2-of-3 Multi Sig Wallet...");
      const { txSignature: createMultisigSignature, multiSigKey: newMultiSigKey, multiSigWallet: newMultiSigWallet } = await payerInstance.createMultisig(
        2,
        [signerOne.publicKey, signerTwo.publicKey, signerThree.publicKey]
      );

      console.log("Tx Signature for the Multi Sig Creation:", createMultisigSignature);
      multiSigKey = newMultiSigKey;
      multiSigWallet = newMultiSigWallet;
      await checkTransactionStatus(createMultisigSignature);
      await sleep(30000); // Wait for 30 seconds
    }

    console.log("Multisig Key:", multiSigKey.toBase58());
    console.log("Multisig Wallet:", multiSigWallet.toBase58());

    // Check multisig balance
    const multiSigBalance = await connection.getBalance(multiSigWallet);
    console.log(`Multisig balance: ${multiSigBalance / LAMPORTS_PER_SOL} SOL`);

    // Deposit 0.0042 SOL to multisig if it exists
    if (multiSigWallet) {
      console.log("Depositing 0.0042 SOL to multisig wallet...");
      await sendSolToMultiSigWallet(0.0042, multiSigWallet);
      await sleep(30000); // Wait for 30 seconds

      // Check updated multisig balance
      const updatedMultiSigBalance = await connection.getBalance(multiSigWallet);
      console.log(`Updated multisig balance: ${updatedMultiSigBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Create a transaction to withdraw 0.001 SOL
    console.log("Creating SOL withdraw instruction...");
    const getSolWithdrawIx = signerOneInstance.getSolTransferInstruction(multiSigKey, 0.001, withdrawalDestination);

    // Create and Sign Multi Sig Transaction (by Signer One)
    console.log("Creating and signing Multi Sig Transaction...");
    const { txSignature: createTransactionSignature, transactionKey } = await signerOneInstance.createTransaction(
      multiSigKey,
      "Withdraw 0.001 SOL to Specified Wallet",
      [getSolWithdrawIx]
    );

    console.log("Tx Signature for the Transaction Creation: ", createTransactionSignature);
    console.log("Transaction Key", transactionKey.toBase58());
    await checkTransactionStatus(createTransactionSignature);
    await sleep(30000); // Wait for 30 seconds

    const firstTxStatus = await payerInstance.getTransaction(transactionKey);
    console.log("First Transaction Status:", firstTxStatus);

    // Reject with Signer Two
    console.log("Rejecting transaction from Signer Two's wallet...");
    const rejectTxSignature = await signerTwoInstance.rejectTransaction(multiSigKey, transactionKey);
    console.log("Tx Signature for the Rejected Transaction: ", rejectTxSignature);
    await checkTransactionStatus(rejectTxSignature);
    await sleep(30000); // Wait for 30 seconds

    const secondTxStatus = await payerInstance.getTransaction(transactionKey);
    console.log("Second Transaction Status:", secondTxStatus);

    // Approve with Signer Three
    console.log("Approving transaction from Signer Three's wallet...");
    const approveTxSignature = await signerThreeInstance.approveTransaction(multiSigKey, transactionKey);
    console.log("Tx Signature for the Approved Transaction: ", approveTxSignature);
    await checkTransactionStatus(approveTxSignature);
    await sleep(30000); // Wait for 30 seconds

    const thirdTxStatus = await payerInstance.getTransaction(transactionKey);
    console.log("Third Transaction Status:", thirdTxStatus);

    // Execute the transaction
    console.log("Executing transaction...");
    try {
      const tryExecuteSig = await signerThreeInstance.executeTransaction(transactionKey);
      console.log("Tx Signature for the Transaction Execution: ", tryExecuteSig);
      await checkTransactionStatus(tryExecuteSig);
    } catch (error) {
      console.error("Error executing transaction:", error);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
    }

    // Check final balances
    const finalPayerBalance = await connection.getBalance(payer.publicKey);
    const finalMultiSigBalance = await connection.getBalance(multiSigWallet);
    const finalWithdrawalDestinationBalance = await connection.getBalance(withdrawalDestination);
    console.log(`Final Payer balance: ${finalPayerBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Final Multisig balance: ${finalMultiSigBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Final Withdrawal Destination balance: ${finalWithdrawalDestinationBalance / LAMPORTS_PER_SOL} SOL`);

    // Fetch all the transactions for the multisig
    console.log("Fetching all transactions for the multisig...");
    const transactions = await signerThreeInstance.getTransactionsForMultisig(multiSigKey);
    console.log("All transactions:", transactions);

  } catch (error) {
    console.error("An error occurred:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
  }
})();