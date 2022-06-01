// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

import React, { useState } from 'react'
import { ethers } from 'ethers'
import './styles.css'
import { Table } from './Table'
import ClipLoader from "react-spinners/ClipLoader";

const SimpleStorage = () => {

	const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [userBalance, setUserBalance] = useState(null);
	const [providedAccount, setProvidedAccount] = useState("");
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');
	const [txdata, setTxdata] = useState([]);
	let [loading, setLoading] = useState(false);
	const columns = [
		{ accessor: 'tx_time', label: 'Transaction Time' },
		{ accessor: 'tx_hash', label: 'Tx Hash' },
		{ accessor: 'from_wallet', label: 'From Wallet' },
		{ accessor: 'to_wallet', label: 'To Wallet' },
		{ accessor: 'amount_usd', label: 'Amount ($)' },
		{ accessor: 'amount_eth', label: 'Amount (ETH)' },
	];
	const connectWalletHandler = () => {
		if (window.ethereum && window.ethereum.isMetaMask) {

			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0]);
				setConnButtonText('Wallet Connected');
			})
			.catch(error => {
				setErrorMessage(error.message);
			
			});

		} else {
			console.log('Need to install MetaMask');
			setErrorMessage('Please install MetaMask browser extension to interact');
		}
	}

	// update account, will cause component re-render
	const accountChangedHandler = (newAccount) => {
		setDefaultAccount(newAccount);
		window.ethereum.request({method: 'eth_getBalance', params: [newAccount.toString(), 'latest']})
		.then(balance => {
			setUserBalance(parseFloat(ethers.utils.formatEther(balance)).toFixed(4) + " " + "ETH");
		})
		.catch(error => {
			setErrorMessage(error.message);
		});	
		setTxdata([]);
		setProvidedAccount("");
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}

	const handleChange = (event) => {
		setProvidedAccount(event.target.value);
		if (providedAccount !== "") {
			setDefaultAccount(event.target.value);
			setUserBalance("0.0000 ETH");
			setTxdata([]);
		}
	}

    const handleClick = () => 
		{    
			let address = "";
			let transactions = [];
			if(defaultAccount !== null) {
				address = defaultAccount;
			}
			if (providedAccount !== "") {
				setDefaultAccount(providedAccount);
				address = providedAccount;
				fetch("https://api-rinkeby.etherscan.io/api?module=account&action=balance&address=" + address + "&tag=latest&apikey=46EDKMSPGR8XD7IA1KFVM3KG5VX1MX9EBU")
				.then((res) => res.json())
				.then((json) => {
					let balance = json.result;
					let amount = (balance / Math.pow(10, 18)).toFixed(4);
					setUserBalance(amount + " " + "ETH");
				})
			}
			if(address !== "") {
				setLoading(true);
				fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD")
				.then((datum) => datum.json())
				.then((resp) => {
					console.log(resp.USD);
					fetch('http://coinfibo.com:5000/api/v1/account/' + address, {
						method: 'GET',
						headers: new Headers({
							'Content-Type': 'application/json; charset=utf-8',
							'api-key': 'key-941ced4a15f196ed319d5e8f144a54df3a972b9e9fd2031e4e9b7b69412eb3f3'
						})							
					})
					.then((response) => response.json())
					.then((jsdata) => {
						let acid = 0;
						if(jsdata[0] === undefined) {
							console.log("<====  New Account ====>");
							fetch('http://coinfibo.com:5000/api/v1/account', {
								method: 'POST',
								headers: new Headers({
									'Content-Type': 'application/json; charset=utf-8',
									'api-key': 'key-941ced4a15f196ed319d5e8f144a54df3a972b9e9fd2031e4e9b7b69412eb3f3'
								}),
								body: JSON.stringify({
									'account_wallet_address': address,
									'account_score': '0',
									'account_verified': '0'
								})							
							})
							.then((reso) => reso.json())
							.then((jso) => {
								acid = jso.data;
								console.log("<====  New Account " + acid + " Created ====>");
								fetch("https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=" + address + "&sort=asc&apikey=46EDKMSPGR8XD7IA1KFVM3KG5VX1MX9EBU")
								.then((res) => res.json())
								.then((json) => {
									let content = json.result;
									content.map((tx) => {
										if(tx.value != 0) {
											console.log(tx);
											let vector = '';
											let txvector = '';
											let otherw = tx.from;
											let sameactx = 0;
											if (address == tx.from) {
												if (address == tx.to) {
													sameactx = 1;
												}
												else {
													txvector = '(-) ';
													vector = '-';
												}
												otherw = tx.to;
											}
											else {
												txvector = '(+) ';
											}
											let amount = (tx.value/Math.pow(10,18)).toFixed(4) * Math.pow(10,4);
											let vecamount = parseInt(vector + "" + amount);
											let amountusd = (resp.USD * (tx.value/Math.pow(10,18)).toFixed(4)).toFixed(2) * Math.pow(10,2);
											let vecamountusd = parseInt(vector + "" + amountusd);
											if (sameactx == 1) {
												amount = 0;
												vecamount = 0;
												amountusd = 0;
												vecamountusd = 0;													
											}
											let timestamp = tx.timeStamp + '000';

											console.log("<====  New Transaction (" + tx.hash + " : " + acid + " : " + otherw + " : " + vecamount + " : " + vecamountusd + " : " + timestamp + ") ====>");
											
											fetch('http://coinfibo.com:5000/api/v1/transaction', {
												method: 'POST',
												headers: new Headers({
													'Content-Type': 'application/json; charset=utf-8',
													'api-key': 'key-941ced4a15f196ed319d5e8f144a54df3a972b9e9fd2031e4e9b7b69412eb3f3'
												}),
												body: JSON.stringify({
													'transaction_hash': tx.hash,
													'transaction_account_id': acid,
													'transaction_wallet_pair': otherw,
													'transaction_amount': vecamount,
													'transaction_amount_usd': vecamountusd,
													'transaction_timestamp': timestamp,
													'transaction_description': '',
													'transaction_currency': 'ETH'
												})							
											})
											.then((rsso) => rsso.json())
											.then((jsso) => {
												console.log(jsso);		
												transactions.push({
													tx_time: new Date(parseInt(tx.timeStamp + "000")).toLocaleString(),
													tx_hash: tx.hash.slice(0, 6) + '...' + tx.hash.substring(tx.hash.length - 4),
													from_wallet: tx.from.slice(0, 6) + '...' + tx.from.substring(tx.from.length - 4),
													to_wallet: tx.to.slice(0, 6) + '...' + tx.to.substring(tx.to.length - 4),
													amount_usd: txvector + (resp.USD * (tx.value / Math.pow(10, 18)).toFixed(4)).toFixed(2),
													amount_eth: txvector + (tx.value/Math.pow(10,18)).toFixed(4)
												});
												setTimeout(() => {
													setTxdata(transactions);
													setLoading(false);
												}, 1000);
											})
										}
									})		
								})		
							})
						}
						else {
							acid = jsdata[0].account_id;
							console.log("<====  Existing Account: " + acid + " ====>");
							fetch("https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=" + address + "&sort=asc&apikey=46EDKMSPGR8XD7IA1KFVM3KG5VX1MX9EBU")
							.then((res) => res.json())
							.then((json) => {
								let content = json.result;
								content.map((tx) => {
									if(tx.value != 0) {
										console.log(tx.hash);
										fetch('http://coinfibo.com:5000/api/v1/transaction/' + tx.hash, {
											method: 'GET',
											headers: new Headers({
												'Content-Type': 'application/json; charset=utf-8',
												'api-key': 'key-941ced4a15f196ed319d5e8f144a54df3a972b9e9fd2031e4e9b7b69412eb3f3'
											})							
										})
										.then((ro) => ro.json())
										.then((so) => {						
											let exists = 0;
											so.forEach((el)=>{
												if(el.transaction_account_id === acid) {
													exists = 1;
												}
											})	
											if(exists === 0) {
												let vector = '';
												let txvector = '';
												let otherw = tx.from;
												let sameactx = 0;
												if (address == tx.from) {
													if (address == tx.to) {
														sameactx = 1;
													}
													else {
														txvector = '(-) ';
														vector = '-';
													}
													otherw = tx.to;
												}
												else {
													txvector = '(+) ';
												}	
												let amount = (tx.value/Math.pow(10,18)).toFixed(4) * Math.pow(10,4);
												let vecamount = parseInt(vector + "" + amount);
												let amountusd = (resp.USD * (tx.value/Math.pow(10,18)).toFixed(4)).toFixed(2) * Math.pow(10,2);
												let vecamountusd = parseInt(vector + "" + amountusd);
												if (sameactx == 1) {
													amount = 0;
													vecamount = 0;
													amountusd = 0;
													vecamountusd = 0;													
												}	
												let timestamp = tx.timeStamp + '000';
		
												console.log("<====  New Transaction (" + tx.hash + " : " + acid + " : " + otherw + " : " + vecamount + " : " + vecamountusd + " : " + timestamp + ") ====>");
												
												fetch('http://coinfibo.com:5000/api/v1/transaction', {
													method: 'POST',
													headers: new Headers({
														'Content-Type': 'application/json; charset=utf-8',
														'api-key': 'key-941ced4a15f196ed319d5e8f144a54df3a972b9e9fd2031e4e9b7b69412eb3f3'
													}),
													body: JSON.stringify({
														'transaction_hash': tx.hash,
														'transaction_account_id': acid,
														'transaction_wallet_pair': otherw,
														'transaction_amount': vecamount,
														'transaction_amount_usd': vecamountusd,
														'transaction_timestamp': timestamp,
														'transaction_description': '',
														'transaction_currency': 'ETH'
													})							
												})
												.then((rsso) => rsso.json())
												.then((jsso) => {			
													console.log(jsso);	
													transactions.push({
														tx_time: new Date(parseInt(tx.timeStamp + "000")).toLocaleString(),
														tx_hash: tx.hash.slice(0, 6) + '...' + tx.hash.substring(tx.hash.length - 4),
														from_wallet: tx.from.slice(0, 6) + '...' + tx.from.substring(tx.from.length - 4),
														to_wallet: tx.to.slice(0, 6) + '...' + tx.to.substring(tx.to.length - 4),
														amount_usd: txvector + (resp.USD * (tx.value / Math.pow(10, 18)).toFixed(4)).toFixed(2),
														amount_eth: txvector + (tx.value/Math.pow(10,18)).toFixed(4)
													});				
													setTimeout(() => {
														setTxdata(transactions);
														setLoading(false);
													}, 1000);
												})		
											}
											else {
												console.log("<====  Existing Transaction " + tx.hash + " ====>");
												let txvector = '';
												let sameactx = 0;
												if (address == tx.from) {
													if (address == tx.to) {
														sameactx = 1;
													}
													else {
														txvector = '(-) ';
													}
												}
												else {
													txvector = '(+) ';
												}	
												transactions.push({
													tx_time: new Date(parseInt(tx.timeStamp + "000")).toLocaleString(),
													tx_hash: tx.hash.slice(0, 6) + '...' + tx.hash.substring(tx.hash.length - 4),
													from_wallet: tx.from.slice(0, 6) + '...' + tx.from.substring(tx.from.length - 4),
													to_wallet: tx.to.slice(0, 6) + '...' + tx.to.substring(tx.to.length - 4),
													amount_usd: txvector + (resp.USD * (tx.value / Math.pow(10, 18)).toFixed(4)).toFixed(2),
													amount_eth: txvector + (tx.value/Math.pow(10,18)).toFixed(4)
												});
												setTimeout(() => {
													setTxdata(transactions);
													setLoading(false);
												}, 1000);
											}										
										})
									}
								})		
							})	
						}
					})
				})
			}
			else {
				console.log("No wallet address provided/connected!");
			}
		}
		
	// listen for account changes
	window.ethereum.on('accountsChanged', accountChangedHandler);

	window.ethereum.on('chainChanged', chainChangedHandler);
	
	return (
		<div>
			<h4> {"Connect your wallet by clicking the button below:"} </h4>
			<button onClick={connectWalletHandler}>{connButtonText}</button>
			<h4> {"Or, provide your wallet address in textbox below:"} </h4>
			<div>
				<h3>Provide your wallet address here:</h3>
			</div>
			<div>
				<input type="text" style={{textAlign: "center"}} value={providedAccount} onChange={handleChange} />
			</div>
			<div>&nbsp;</div>
			<div>			
				<button onClick={handleClick}>
					Fetch Transactions
				</button>				
			</div>
			<div>&nbsp;</div>
			<div>
				<table style={{ tableLayout : "fixed", width: "100%" }}>
					<thead>
						<tr>
							<th><span></span>Wallet Address</th>
							<th><span></span>Wallet Balance</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><span>{errorMessage}</span>{defaultAccount}</td>
							<td><span>{errorMessage}</span>{userBalance}</td>
						</tr>						
					</tbody>
				</table>			
			</div>
			<div>&nbsp;</div>
			<ClipLoader loading={loading} size={300} />
			<Table rows={txdata} columns={columns} />
		</div>
	);
}

export default SimpleStorage;