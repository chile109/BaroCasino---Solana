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
import { useEffect } from "react";

const idl = require("../public/idl.json");

const Home: NextPage = () => {
  const anchorWallet = useAnchorWallet();
  const connection = new web3.Connection("https://api.devnet.solana.com");
  async function initBaccarate() {
    if (!anchorWallet) {
        return;
      }
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    try
    {
        const [bet_account] = await web3.PublicKey.findProgramAddress(
            [
                Buffer.from("bet"), 
                provider.wallet.publicKey.toBuffer()
            ],
            program.programId
          );
        console.log("bet_account: ", bet_account.toString());

        const tx = await program.methods
        .init()
        .accounts({
          authority: provider.wallet.publicKey,
          betAccount: bet_account,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(tx);
    }
    catch (err) {
        console.log(err);
    }
  }

  async function sendTransaction() {
    if (!anchorWallet) {
      return;
    }

    const connection = new web3.Connection("https://api.devnet.solana.com");
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    try {
        const [bet_account] = await web3.PublicKey.findProgramAddress(
        [
            Buffer.from("bet"), 
            provider.wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      console.log("bet_account: ", bet_account.toString());

      const bankerWin = new BN(10);
      const playerWin = new BN(15);
      const tie = new BN(5);
      const bankerPair = new BN(0);
      const playerPair = new BN(0);

      const tx = await program.methods
        .bet(bankerWin, playerWin, tie, bankerPair, playerPair)
        .accounts({
          authority: provider.wallet.publicKey,
          betAccount: bet_account,
        })
        .rpc();

      console.log(tx);
    } catch (err) {
      console.log(err);
    }
  }
  


  useEffect(() => {
    if (!anchorWallet) return;

    const connection = new web3.Connection("https://api.devnet.solana.com");
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    const subscriptionId = program.addEventListener("GameResult", (event) => {
        console.log("GameResult event:", event);
      });

    return () => {
        program.removeEventListener(subscriptionId);
      };
    }, [anchorWallet]);
  

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
        <button onClick={initBaccarate}>Init Baccarate</button>
          <button onClick={sendTransaction}>Create Transaction</button>
        </p>
      </main>
    </div>
  );
};

export default Home;
