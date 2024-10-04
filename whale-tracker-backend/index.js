// index.js
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.DB_URL);
const app = express();
app.use(express.json());
app.use(cors());

const url = "https://streaming.bitquery.io/graphql";
const headers = {
  "Content-Type": "application/json",
  "X-API-KEY": process.env.BITQUERY_API_KEY,
};

const fetchTop10WhaleAccounts = async () => {
  const query = `
    {
      EVM(dataset: archive, network: bsc) {
        TokenHolders(
          tokenSmartContract: "0x31e79a378fb85d8c4d51489e5c90ecaf9c17935a"
          limit: {count: 10}
          orderBy: {descending: Balance_Amount}
        ) {
          Balance {
            Amount
          }
          Holder {
            Address
          }
        }
      }
    }`;

  try {
    const response = await axios.post(url, { query }, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching whale accounts", error);
    return [];
  }
};

const fetchWhaleTransactions = async (address) => {
  const transactionQuery = `
    {
      EVM(dataset: realtime, network: bsc) {
        Transactions(
          where: {any: {Transaction: {From: {is: "${address}"}, To: {is: "${address}"}}}}
          limit: {count: 5, offset: 0}
        ) {
          Transaction {
            Hash
            Cost
            From
            To
            GasPrice
            Gas
            GasPriceInUSD
          }
        }
      }
    }`;

  try {
    const response = await axios.post(url, { query: transactionQuery }, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions", error);
    return [];
  }
};

const whaleTransactionSchema = new mongoose.Schema({
  hash: String,
  cost: Number,
  from: String,
  to: String,
  gasPrice: Number,
  gas: Number,
  gasPriceInUSD: Number,
  timestamp: { type: Date, default: Date.now },
});

const WhaleTransaction = mongoose.model("WhaleTransaction", whaleTransactionSchema);

let task = null;
app.post("/api/set-interval", (req, res) => {
  const { interval } = req.body; // Interval e.g., '*/5 * * * *' for every 5 minutes

  if (task) {
    task.stop();
  }

  task = cron.schedule(interval, async () => {
    const holdersList = await fetchTop10WhaleAccounts();

    if (holdersList.data.EVM.TokenHolders.length > 0) {
      for (const whale of holdersList.data.EVM.TokenHolders) {
        const transactions = await fetchWhaleTransactions(whale.Holder.Address);

        for (const transaction of transactions.data.EVM.Transactions) {
          const newTransaction = new WhaleTransaction({
            hash: transaction.Transaction.Hash,
            cost: transaction.Transaction.Cost,
            from: transaction.Transaction.From,
            to: transaction.Transaction.To,
            gasPrice: transaction.Transaction.GasPrice,
            gas: transaction.Transaction.Gas,
            gasPriceInUSD: transaction.Transaction.GasPriceInUSD,
          });

          try {
            await newTransaction.save();
            console.log(`Transaction ${transaction.Transaction.Hash} saved to database.`);
          } catch (error) {
            console.error("Error saving transaction to database", error);
          }
        }

        console.log(`Whale Address: ${whale.Holder.Address}`);
        console.log("Fetched Whale Transactions:", JSON.stringify(transactions.data.EVM));
      }
    }
  });

  task.start();
  res.json({ message: `Cron job set to run at interval: ${interval}` });
});

app.get("/api/whale-transactions", async function (req, res) {
  const data = await WhaleTransaction.find({});
  res.json(data);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));