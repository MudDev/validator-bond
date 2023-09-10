import React, {useEffect} from 'react';
import {getKeplrFromWindow} from "./util/getKeplrFromWindow";
import {CosmosChainInfo} from "./constants";
import {Balances} from "./types/balance";
import {Dec, DecUtils} from "@keplr-wallet/unit";
import {sendMsgs} from "./util/sendMsgs";
import {api} from "./util/api";
import {simulateMsgs} from "./util/simulateMsgs";
import {MsgSend} from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import axios from 'axios';
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";

function App() {
  const [address, setAddress] = React.useState<string>('');
  const [balance, setBalance] = React.useState<string>('');

  const [recipient, setRecipient] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');
  const [validatorAddress, setValidatorAddress] = React.useState<string>('cosmosvaloper10v6wvdenee8r9l6wlsphcgur2ltl8ztkfrvj9a'); // default validator address

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const keplr = await getKeplrFromWindow();

    if(keplr) {
      try {
        await keplr.experimentalSuggestChain(CosmosChainInfo);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  }

  const getKeyFromKeplr = async () => {
    const key = await window.keplr?.getKey(CosmosChainInfo.chainId);
    if (key) {
      setAddress(key.bech32Address)
    }
  }

  const getBalance = async () => {
    const key = await window.keplr?.getKey(CosmosChainInfo.chainId);

    if (key) {
      const uri = `${CosmosChainInfo.rest}/cosmos/bank/v1beta1/balances/${key.bech32Address}?pagination.limit=1000`;

      const data = await api<Balances>(uri);
      const balance = data.balances.find((balance) => balance.denom === "uatom");
      const osmoDecimal = CosmosChainInfo.currencies.find((currency) => currency.coinMinimalDenom === "uatom")?.coinDecimals;

      if(balance) {
        const amount = new Dec(balance.amount, osmoDecimal);
        setBalance(`${amount.toString(osmoDecimal)} ATOM`)
      } else {
        setBalance(`0 ATOM`)
      }
    }
  }

  const sendBalance = async () => {
    if (window.keplr) {
      const key = await window.keplr.getKey(CosmosChainInfo.chainId);
      const protoMsgs = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: key.bech32Address,
          toAddress: recipient,
          amount: [
            {
              denom: "uatom",
              amount: DecUtils.getTenExponentN(6).mul(new Dec(amount)).truncate().toString(),
            },
          ],
        }).finish(),
      }

      try {
        const gasUsed = await simulateMsgs(
          CosmosChainInfo,
          key.bech32Address,
          [protoMsgs],
          [{denom: "uatom",
            amount: "236",}]
          );

        if(gasUsed) {
          await sendMsgs(
            window.keplr,
            CosmosChainInfo,
            key.bech32Address,
            [protoMsgs],
            {
              amount: [{denom: "uatom",
                amount: "236",}],
              gas: Math.floor(gasUsed * 1.5).toString(),
            })
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }

    }
  }

  // Function to get account information, needed to sign the transaction.
  async function getAccountInfo(address: string) {
    // Make a request to your Cosmos REST API endpoint to fetch account details
    const response = await fetch(`https://rest.seed-02.theta-testnet.polypore.xyz/auth/accounts/${address}`);
    const data = await response.json();
    return {
        accountNumber: data.result.value.account_number,
        sequence: data.result.value.sequence
    };
  }

  const sendValidatorBond = async () => {
    const chainId = CosmosChainInfo.chainId;

    // Get the Keplr object and check if the user has given permission for this chain
    const keplr = window.keplr;
    if (!keplr) {
        console.error("Keplr not found!");
        return;
    }

    // Ensure that Keplr is ready and the user has approved the chain
    await keplr.enable(chainId);
    const key = await keplr.getKey(chainId);

    // Get the signer from Keplr
    const signer = keplr.getOfflineSigner(chainId);

    // Get the sender's address from Keplr
    const senderAddress = key.bech32Address
    
    // Define the message for bonding
    const msg = {
        type: "/cosmos.staking.v1beta1.MsgValidatorBond",
        value: {
            delegator_address: senderAddress,
            validator_address: validatorAddress,
        },
    };

    // Create the transaction
    const tx = {
        fee: {
            amount: [{ denom: "uatom", amount: "2000" }],  // Adjust the fee as necessary
            gas: "200000",  // Adjust the gas as necessary
        },
        chain_id: chainId,
        memo: "",  // Optional memo
        msg: [msg],
    };

    const accountInfo = await getAccountInfo(senderAddress);

    // Send the transaction using Keplr's signer
    const signedTx = await signer.signAmino(senderAddress, {
      chain_id: tx.chain_id,
      account_number: accountInfo.accountNumber,
      sequence: accountInfo.sequence,
      fee: tx.fee,
      msgs: tx.msg,
      memo: tx.memo,
  });

  // Broadcast the signed transaction
  const response = await axios.post(
      `${CosmosChainInfo.rest}txs`,
      {
          tx: signedTx,
          mode: "sync"
      }
  );

  if (response.data.code === 0) {
      console.log("Transaction sent successfully:", response.data.txhash);
  } else {
      console.error("Failed to broadcast transaction:", response.data.raw_log);
  }
};



  return (
    <div className="root-container">
        <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px"
        }}>
          <img src="https://silknodes.io/img/core-img/icon.png" style={{maxWidth: "200px"}} alt="silknodes-logo" />
        </div>
        <div className="item-title">Silk Nodes ATOM Wallet Functions</div>


      <div className="item-container">
        <div className="item">
          <div className="item-title">
            Get ATOM Address
          </div>

          <div className="item-content">
            <div>
              Address: {address}
            </div>

            <div>
              <button className="keplr-button" onClick={getKeyFromKeplr}>Get Address</button>
            </div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Get ATOM Balance
          </div>

          <div className="item-content">
            Balance: {balance}

            <button className="keplr-button" onClick={getBalance}>Get Balance</button>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Send ATOM
          </div>

          <div className="item-content">
            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Recipient:
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Amount:
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <button className="keplr-button" onClick={sendBalance}>Send</button>
          </div>
        </div>

        <div className="item">
            <div className="item-title" style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Bond to Validator
            </div>
            <div className="item-content" style={{
              display: "flex",
              flexDirection: "column",
              paddingBottom: "75px"
            }}>
                Validator Address:
                <input 
                  type="text" 
                  value={validatorAddress} 
                  onChange={(e) => setValidatorAddress(e.target.value)} 
                  placeholder="Enter Validator Address"
                />
              <button className="keplr-button" onClick={sendValidatorBond}>Bond</button>
            </div>
          </div>

      </div>
    </div>
  );
}

export default App;
