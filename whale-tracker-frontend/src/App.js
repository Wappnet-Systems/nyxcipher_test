import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {

  const [interval, setInterval] = useState('');
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/set-interval`, { interval });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error setting cron job', error);
      setMessage('Failed to set cron job.');
    }
  };

  const fetchWhaleTransactions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/whale-transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching whale transactions', error);
      return [];
    }
  };

  const getTransactions = async () => {
    const data = await fetchWhaleTransactions();
    setTransactions(data);
  };

    useEffect(() => {
      getTransactions();
    }, []);


  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
      <h1>Whale Transaction Monitor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Enter Cron Interval (e.g., */5 * * * *)</label>
          <input
            type="text"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            placeholder="*/5 * * * *"
            required
          />
        </div>
        <button type="submit">Set Interval</button>
      </form>
      {message && <p>{message}</p>}
    </div>

    <button onClick={getTransactions} style={{ margin: '20px', padding: '10px 20px', fontSize: '16px' }}>Fetch Latest Data</button>
<div style={{ textAlign: 'center' }}>
  <h2>Whale Transactions</h2>
  {transactions.length === 0 ? (
    <p>No transactions available.</p>
  ) : (
    <table style={{ margin: '0 auto', borderCollapse: 'collapse', width: '80%' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Hash</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cost</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>From</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>To</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Gas Price</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Gas</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Gas Price in USD</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx._id}>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.hash}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.cost}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.from}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.to}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.gasPrice}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.gas}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{tx.gasPriceInUSD}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

    </div>
  );
}

export default App;