import React, { useEffect, useRef, useState } from 'react'

// ... (其他的导入)
import axios from 'axios'

import './App.css'
import alanBtn from "@alan-ai/alan-sdk-web"
import {
  Box, Button, Flex, Img, Spacer, useBreakpointValue,
} from '@chakra-ui/react'
// import { useState } from 'react'
import { connectWallet } from './utils/connectWallet'
import { ChakraProvider } from '@chakra-ui/react'
import Web3 from 'web3'
import { Core } from '@walletconnect/core'
import { Text } from "@chakra-ui/react"
import { IDKitWidget, CredentialType } from '@worldcoin/idkit'
import { Web3Button } from '@web3modal/react'
import { ChainId, Token, WETH, Trade, Route, Percent, TradeType } from '@uniswap/v3-sdk'
import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { ethers } from 'ethers'
//import { NonfungiblePositionManager, SwapRouter } from '@uniswap/v3-periphery'
import {
  Connection,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  clusterApiUrl, LAMPORTS_PER_SOL, PublicKey
} from '@solana/web3.js';

import * as buffer from "buffer";
import bs58 from "bs58";
window.Buffer = buffer.Buffer;
let alanBtnInstance
function App () {
  const alanBtnContainer = useRef()
  const logoEl = useRef()
  const web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY')
  const [walletAddress, setWalletAddress] = useState('')
  const [showWalletAddress, setshowWalletAddress] = useState('')
  const [balance, setBalance] = useState(null)
  const name2addr = {
    'BOYU': 'ER8NjKKtTrkNxQTgt6C2fFeCRdF4yqnwrSyxQ4gXLBtj',
    'BOB': 'ER8NjKKtTrkNxQTgt6C2fFeCRdF4yqnwrSyxQ4gXLBtj',
    'ALICE': '6E4WcCGK3JtuKLvYxakv9uwmscehtRQotKiW9oyvYdAr',
    'DAVID': '0xae26fC8A9A3396a309e57963834457681f473C2D'
  }
  const BobPriKey = '000'; // input your private key.
  
  const handleProof = result => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), 3000)
      // NOTE: Example of how to decline the verification request and show an error message to the user
    })
  }

  const onSuccess = result => {
    console.log(result)
  }

  const urlParams = new URLSearchParams(window.location.search)
  const credential_types = urlParams.get('credential_types')
    ? urlParams.get('credential_types').split(',')
    : [CredentialType.Orb, CredentialType.Phone]

  const action = urlParams.get('action') || 'register'
  const app_id =
    urlParams.get('app_id') || 'app_staging_2e79568227debfad7ee2c133640cdf75'

  const sendTransaction = async (fromAddress, toAddress, amount) => {
    try {
      const ethAmount = web3.utils.toWei(amount, 'ether')
      const gasPrice = await web3.eth.getGasPrice()
      const nonce = await web3.eth.getTransactionCount(fromAddress)

      const txObject = {
        from: fromAddress,
        to: toAddress,
        value: web3.utils.toHex(ethAmount),
        gas: web3.utils.toHex(21000),
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
      }

      web3.eth.sendTransaction(txObject)
        .on('transactionHash', (hash) => {
          console.log('Transaction hash:', hash)
        })
        .on('error', (error) => {
          console.error('Error while sending transaction:', error)
        })
    } catch (error) {
      console.error('Error while sending transaction:', error)
    }
  }

  const getBalance = async (address) => {
    try {
      const balanceWei = await web3.eth.getBalance(address, 'latest') // <-- Added 'latest'
      const balanceEther = web3.utils.fromWei(balanceWei, 'ether')
      await alanBtnInstance.activate()
      alanBtnInstance.playText("Your balance is " + balanceEther)
      return balanceEther
    } catch (error) {
      console.error('Error getting balance:', error)
      return null
    }
  }

  async function getSolBalance(address) {
    try {
      // 将地址字符串转换为 PublicKey 对象
      const publicKey = new PublicKey(address);

      // 查询账户余额
      const balance = await connection.getBalance(publicKey);
      console.log(`地址 ${address} 的账户余额：${balance / 1000000000} SOL`);
      await alanBtnInstance.activate()
      alanBtnInstance.playText("Your balance is " + balance / 1000000000)
      return balance / 1000000000;
    } catch (error) {
      console.error('查询余额时出错：', error);
    }
  }



  const handleWalletConnection = async () => {
    try {
      // 请求用户连接钱包
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const connectedAddress = accounts[0]
      if (connectedAddress) {
        setWalletAddress(connectedAddress)
        setshowWalletAddress(connectedAddress.slice(0, 8))
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const wordToNumber = (word) => {
    switch (word) {
      case 'one':
        return '1'
      case 'two':
        return '2'
      case 'three':
        return '3'
      case 'four':
        return '4'
      case 'five':
        return '5'
      case 'six':
        return '6'
      case 'seven':
        return '7'
      case 'eight':
        return '8'
      case 'nine':
        return '9'
      default:
        return word
    }
  }

  // swap ETH -> USDT
  // const swapEthToUsdt = async (ethAmount) => {
  //   try {
  //     const provider = new Web3Provider(window.ethereum)
  //     const signer = provider.getSigner()

  //     const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6) // USDT token address on mainnet
  //     const pair = await Fetcher.fetchPairData(WETH[ChainId.MAINNET], USDT, provider)

  //     const route = new Route([pair], WETH[ChainId.MAINNET])
  //     const trade = new Trade(route, new TokenAmount(WETH[ChainId.MAINNET], ethers.parseEther(ethAmount).toString()), TradeType.EXACT_INPUT)
  //     console.log(trade)
  //     const value = trade.inputAmount.raw.toString()

  //     const tx = await signer.sendTransaction({
  //       to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap's router address for mainnet
  //       data: trade.executionParameters().toHex(),
  //       value,
  //       gasLimit: 200000,
  //       gasPrice: ethers.parseUnits('10.0', 'gwei')
  //     })

  //     console.log('Transaction hash:', tx.hash)
  //     await tx.wait()
  //   } catch (error) {
  //     console.error("Error occurred:", error.message)
  //   }







  // }

  // const swapEthToUsdt = async (ethAmount) => {
  //   const provider = new Web3Provider(window.ethereum)
  //   const signer = provider.getSigner()

  //   const USDT = new Token(ChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6)
  //   const WETH9 = new Token(ChainId.MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18)

  //   //const pool = await Fetcher.fetchPoolData(WETH9, USDT, 3000, provider) // assuming a 0.3% fee
  //   //const route = new Route([pool], WETH9)
  //   //const trade = new Trade(route, new TokenAmount(WETH9, ethers.utils.parseEther(ethAmount).toString()), TradeType.EXACT_INPUT)

  //   const slippageTolerance = new Percent('50', '10000') // 0.5%
  //   const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString()
  //   const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  //   const swapParams = {
  //     path: [WETH9.address, USDT.address],
  //     recipient: signer.address,
  //     deadline: deadline,
  //     amountIn: trade.inputAmount.raw.toString(),
  //     amountOutMinimum: amountOutMin,
  //     sqrtPriceLimitX96: undefined
  //   }

  //   const router = new Contract(
  //     SwapRouter.ADDRESS,
  //     JSON.stringify(SwapRouter.ABI),
  //     signer
  //   )
  //   const tx = await router.exactInput(swapParams, { value: trade.inputAmount.raw.toString() })

  //   console.log('Transaction hash:', tx.hash)
  //   await tx.wait()
  // }
  // const [nftData, setNftData] = useState(null)

  const fetchNftData = async () => {
    try {
      const response = await axios.get('http://49.51.69.239:9083/masknetwork?didname=yansuji')
      console.log(response.data)
      //setData(response.data);
    } catch (err) {
      //setError(err);
      console.log(err)
    }
  }

  const connection = new Connection('https://api.devnet.solana.com');

  async function sendSolanaTransaction(senderPrivateKey, recipientPublicKey, amount) {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const senderKeyPair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(senderPrivateKey)));
    const recipientAddress = new PublicKey(recipientPublicKey);

    // 将金额转换为lamports（1 SOL = 1e9 lamports）
    const amountInLamports = amount * 1e9;

    // 创建转账交易指令
    const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeyPair.publicKey,
          toPubkey: recipientAddress,
          lamports: amountInLamports
        })
    );

    // 签署交易
    transaction.feePayer = senderKeyPair.publicKey;
    const blockhash = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash.blockhash;
    transaction.sign(senderKeyPair);

    // 发送交易
    const transactionId = await connection.sendRawTransaction(transaction.serialize());

    console.log('Transaction sent:', transactionId);

    return transactionId;
  }

// 函数接收 fromAddress, toAddress, 和 amount 作为参数
  async function transferSol(fromAddress, toAddress, amount) {
    // let payer = Keypair.generate();
    // let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    //
    // let toAccount = Keypair.generate();
    //
    // let transaction = new Transaction();
    //
    //
    // transaction.add(
    //     SystemProgram.transfer({
    //       fromPubkey: payer.publicKey,
    //       toPubkey: toAccount.publicKey,
    //       lamports: 1000,
    //     }),
    // );
    //
    // await sendAndConfirmTransaction(connection, transaction, [payer]);


    try {
      sendSolanaTransaction(BobPriKey, toAddress, amount);
      await alanBtnInstance.activate();
      alanBtnInstance.playText("transfer sucess");

      const fromPublicKey = new PublicKey(fromAddress);
      const toPublicKey = new PublicKey(toAddress);

      // 创建一个 Solana 钱包交易
      // const transaction = new Transaction();
      // transaction.add(
      //     SystemProgram.transfer({
      //       fromPubkey: fromPublicKey,
      //       toPubkey: toPublicKey,
      //       lamports: amount * 1000000, // 将 SOL 转换为 lamports
      //     })
      // );
      //
      // // 发送并确认
      // const signature = await sendAndConfirmTransaction(connection, transaction);
      // console.log(`从 ${fromAddress} 到 ${toAddress} 的交易已发送：${signature}`);
    } catch (error) {
      console.error('发送交易时出错：', error);
    }
  }



  useEffect(() => {
    alanBtnInstance = alanBtn({
      key: '68d9aa1f4adbe43008263e17172fc8fc2e956eca572e1d8b807a3e2338fdd0dc/stage',
      rootEl: alanBtnContainer.current,
      onCommand: async (commandData) => {
        console.log(commandData)
        if (commandData.command === 'transfer') {

          let fromUser = commandData.data.fromUser
          let toUser = commandData.data.toUser
          let num = wordToNumber(commandData.data.num)
          console.log(name2addr[fromUser.toUpperCase()], name2addr[toUser.toUpperCase()], num)
          // sendTransaction(name2addr[fromUser.toUpperCase()], name2addr[toUser.toUpperCase()], num)
          transferSol(name2addr[fromUser.toUpperCase()], name2addr[toUser.toUpperCase()], num)
          console.log("fromUser", fromUser)
          console.log(commandData.data)
        }
        if (commandData.command === 'checkBalance') {
          console.log(commandData.data)
          let user = commandData.data.user
          // getBalance(name2addr[user.toUpperCase()])
          getSolBalance(name2addr[user.toUpperCase()]);
        }
        if (commandData.command === 'swap') {
          console.log(commandData.data)
          await fetchNftData()
          //swapEthToUsdt('1')
        }
      }
    })
  }, [])

  return (
    <ChakraProvider>
      <div className="App">

        <Flex
          as="nav"
          align="center"
          justify="space-between"
          wrap="wrap"
          padding="1rem"
          boxShadow="md"
          height="8vh"
        >
          <Box>
            <h1 className="logo">Autowallet</h1>
          </Box>
          <Spacer />
          <Button colorScheme="gray" onClick={handleWalletConnection}>
            {walletAddress ? showWalletAddress : 'Connect Wallet'}
          </Button>
        </Flex>
        <header className="App-header">
          {balance !== null && (
            <p>Balance: {balance} ETH</p>
          )}
          <Flex align="center" justify="center" width="90%">
            <img src="https://p7.itc.cn/images01/20210308/71b966b6df1a492e8ec1eb8ae2c9b82e.png"
              ref={logoEl}
              className="Alan-logo" alt="logo" />
            <Box marginLeft="20px">
              <Text fontSize={60} fontWeight="extrabold">
                AutoWallet
              </Text>
              <Text fontSize={30} fontWeight="extrabold">
                Integrating the Solana Ecosystem with Automatic Speech Recognition
              </Text>
              <ul>
                <li>Say: "Hello"</li>
                <li>Say: "My name is xxx"</li>
                <li>Say: "Transfer xxx to xxx"</li>
                <li>Say: "Check my balance"</li>
                <li>"other data analysis query......"</li>
              </ul>
            </Box>
          </Flex>


          <div className="micicon" ref={alanBtnContainer}></div>

          <Box w="100%" h="20px" />

          <uu>
            Join AutoWallet, Easily Control Your Wallet With Your Voice
          </uu>
          <us>
            This wallet supports Solana and is created by Landloper
          </us>


        </header>
      </div>
    </ChakraProvider>

  )

}
export default App