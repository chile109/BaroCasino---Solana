import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import {
  AnchorProvider,
  BN,
  Program,
  utils,
  web3,
} from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

const idl = require("../public/idl.json");

const Home: NextPage = () => {
  const anchorWallet = useAnchorWallet();

  async function sendTransaction() {
    if (!anchorWallet) {
      return;
    }

    const connection = new web3.Connection(
        "https://api.devnet.solana.com"
      );
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    try {
        const id = new BN(1);
        const proposalName = "Proposal 1";
        const rewardAmount = new BN(1000000000);

      const [proposalAccount, bump] =
        await web3.PublicKey.findProgramAddress(
          [
            Buffer.from("proposal"),
            provider.wallet.publicKey.toBuffer(),
            Buffer.from(id.toArray("le", 8)),
          ],
          program.programId
        );

      const tx = await program.methods
        .propose(id, proposalName, rewardAmount)
        .accounts({
          authority: provider.wallet.publicKey,
          proposalAccount: proposalAccount,
          systemProgram: web3.SystemProgram.programId,
        }).rpc();

        console.log(tx);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <div className={styles.walletButtons}>
          <WalletMultiButton />
          <WalletDisconnectButton />
        </div>

        <p className={styles.description}>
          <button onClick={sendTransaction}>Create Transaction</button>
        </p>
      </main>
    </div>
  );
};

export default Home;
