import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import styles from "../styles/Home.module.css";
import {
  AnchorProvider,
  BN,
  Program,
  web3,
  BorshCoder,
} from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { generateBaccaratResult, type GameResult } from "../utils/baccarat";
import Unity, { UnityContext } from "react-unity-webgl";
import type { NextPage } from "next";
import React, { useEffect } from "react";

const idl = require("../public/idl.json");
const unityContext = new UnityContext({
  loaderUrl: "UnityBuild/Barocasino.loader.js",
  dataUrl: "UnityBuild/Barocasino.data",
  frameworkUrl: "UnityBuild/Barocasino.framework.js",
  codeUrl: "UnityBuild/Barocasino.wasm",
});

const Home: NextPage = () => {
  const anchorWallet = useAnchorWallet();
  const connection = new web3.Connection("https://api.devnet.solana.com");
  let gameResult: GameResult;
  
  async function initBaccarate() {
    if (!anchorWallet) {
      return;
    }
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    try {
      const [bet_account] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("bet"), provider.wallet.publicKey.toBuffer()],
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

        getCurrentCredit();

      console.log(tx);
    } catch (err) {
      console.log(err);
    }
  }

  async function sendTransaction(
    bankerWin: BN,
    playerWin: BN,
    tie: BN,
    bankerPair: BN,
    playerPair: BN
  ) {
    if (!anchorWallet) {
      console.log("No wallet");
      return;
    }

    const connection = new web3.Connection("https://api.devnet.solana.com");
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);

    try {
      const [bet_account] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("bet"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

      console.log("bet_account: ", bet_account.toString());

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
      switch (event.result) {
        case "Player Win":
          gameResult = generateBaccaratResult("Player");
          break;
        case "Banker Win":
          gameResult = generateBaccaratResult("Banker");
          break;
        case "Tie":
          gameResult = generateBaccaratResult("Tie");
          break;
      }

      sendPlayerShowdown(gameResult);
      // sendBankerShowdown(gameResult);
      getCurrentCredit();
      console.log("GameResult event:", event);
    });

    return () => {
      program.removeEventListener(subscriptionId);
    };
  }, [anchorWallet]);

  useEffect(() => {
    unityContext.on(
      "BetCallback",
      (player, banker, tie, playerPair, bankerPair) => {
        console.log("bet:", banker, player, tie, playerPair, bankerPair);
        sendTransaction(
          new BN(banker),
          new BN(player),
          new BN(tie),
          new BN(playerPair),
          new BN(bankerPair)
        );
      }
    );
    // unityContext.on('RequestPlayerShowCard', () => {
    //   sendPlayerShowdown(gameResult);
    // });
    // unityContext.on('RequestBankerShowCard', () => {
    //   sendBankerShowdown(gameResult);
    // });
  }, [anchorWallet]);

  function sendBankerShowdown(gameResult: GameResult) {
    unityContext.send(
      "BrowserBridge",
      "GetBankerShowCard",
      `{"Items": ${JSON.stringify(gameResult.bankerCards)}}`
    );
  }

  function sendPlayerShowdown(gameResult: GameResult) {
    unityContext.send(
      "BrowserBridge",
      "GetPlayerShowCard",
      `{"Items": ${JSON.stringify(gameResult.playerCards)}}`
    );
  }

  async function getCurrentCredit() {
    if (!anchorWallet) return;
    const connection = new web3.Connection("https://api.devnet.solana.com");
    const provider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "processed",
    });
    const program = new Program(idl, idl.metadata.address, provider);
    const [bet_account] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("bet"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const data = await program.account.betAccount.fetch(bet_account); 
    unityContext.send(
      "BrowserBridge",
      "GetCredit",
      data.balance.toString()
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.walletButtons}>
          <WalletMultiButton />
          <WalletDisconnectButton />
          <button onClick={initBaccarate}>Init Baccarate</button>
        </div>

        <div className="game-block">
          <Unity
            unityContext={unityContext}
            style={{
              height: "100%",
              width: "100%",
              borderRadius: "15px",
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Home;
