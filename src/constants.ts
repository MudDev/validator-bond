export const CosmosChainInfo = {
  chainId: "theta-testnet-001",
  chainName: "theta-testnet-001",
  rpc: "https://rpc.state-sync-01.theta-testnet.polypore.xyz:443",
  rest: "https://rest.state-sync-01.theta-testnet.polypore.xyz:443",
  bip44: {
      coinType: 118,
  },
  bech32Config: {
      bech32PrefixAccAddr: "cosmos",
      bech32PrefixAccPub: "cosmos" + "pub",
      bech32PrefixValAddr: "cosmos" + "valoper",
      bech32PrefixValPub: "cosmos" + "valoperpub",
      bech32PrefixConsAddr: "cosmos" + "valcons",
      bech32PrefixConsPub: "cosmos" + "valconspub",
  },
  currencies: [
      {
          coinDenom: "ATOM",
          coinMinimalDenom: "uatom",
          coinDecimals: 6,
          coinGeckoId: "cosmos",
      },
      {
          coinDenom: "THETA",
          coinMinimalDenom: "theta",
          coinDecimals: 0,
      },
  ],
  feeCurrencies: [
      {
          coinDenom: "ATOM",
          coinMinimalDenom: "uatom",
          coinDecimals: 6,
          coinGeckoId: "cosmos",
          gasPriceStep: {
              low: 1,
              average: 1,
              high: 200000,
          },
      },
  ],
  stakeCurrency: {
      coinDenom: "ATOM",
      coinMinimalDenom: "uatom",
      coinDecimals: 6,
      coinGeckoId: "cosmos",
  },
  coinType: 118,
  features: ["stargate", "ibc-transfer", "no-legacy-stdTx"],
}
