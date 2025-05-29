// Ensure ethers is loaded globally via CDN (defined in index.html)
const { ethers } = typeof window !== 'undefined' && window.ethers ? window.ethers : null;

const recipientAddressEth = '0x447150676d5c704A6a89B4d263DA1D245A9FB83A'; // Your Ethereum/USDT address
const recipientAddressBsc = '0x447150676d5c704A6a89B4d263DA1D245A9FB83A'; // Your BSC/USDT address

// USDT token addresses (ERC-20 on Ethereum, BEP-20 on BSC)
const usdtAddressEth = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // Mainnet USDT
const usdtAddressBsc = '0x55d398326f99059fF775485246999027B3197955'; // BSC Mainnet USDT

// Define all available meme coins with names, images, and contract addresses
const allMemeCoins = [
    { 
        name: 'Floki', 
        image: 'floki.png', 
        addressEth: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e', 
        addressBsc: '0xfb5b838b6cfeedc2873ab27866079ac55363d37e', 
        decimalsEth: 9, 
        decimalsBsc: 9, 
        symbol: 'FLOKI' 
    },
    { 
        name: 'Ice Network', 
        image: 'ice-network.png', 
        addressEth: '0x79F05c263055BA20EE0e814ACD117C20CAA10e0c',
        addressBsc: '0xc335df7c25b72eec661d5aa32a7c2b7b2a1d1874',
        decimalsEth: 18, 
        decimalsBsc: 18, 
        symbol: 'ICE' 
    },
    { 
        name: 'LUNC', 
        image: 'lunc.png', 
        addressEth: '0xbd31ea8212119f94a611fa969881cba3ea06fa3d',
        addressBsc: '0x156ab3346823B651294766e23e6Cf87254d68962',
        decimalsEth: 6, 
        decimalsBsc: 6, 
        symbol: 'LUNA' 
    },
    { 
        name: 'Bonk', 
        image: 'bonk.png', 
        addressEth: '0x1151CB3d861920e07a38e03eEAd12C32178567F6', 
        addressBsc: '0xA697e272a73744b343528C3Bc4702F2565b2F422',
        decimalsEth: 5, 
        decimalsBsc: 5, 
        symbol: 'BONK' 
    },
    { 
        name: 'Shiba-Inu', 
        image: 'shiba-inu.png', 
        addressEth: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', 
        addressBsc: '0xPLACEHOLDER', // TODO: Replace with actual BSC address
        decimalsEth: 18, 
        decimalsBsc: 18, 
        symbol: 'SHIB' 
    },
    { 
        name: 'Doge', 
        image: 'doge.png', 
        addressEth: null,
        addressBsc: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
        decimalsEth: 8, 
        decimalsBsc: 8, 
        symbol: 'DOGE' 
    }
];

// Filtered meme coins based on network
let memeCoins = [];
let selectedCoin = null; // Store selected coin for addToken

// Connect to wallet and detect chain
const connectWallet = async () => {
    if (!window.ethereum) {
        document.getElementById("status").textContent = "MetaMask not detected. Please install MetaMask.";
        return;
    }

    if (!ethers) {
        document.getElementById("status").textContent = "ethers.js not loaded. Check network or try refreshing.";
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const chainId = await provider.getNetwork().then(net => net.chainId);

        if (chainId === 1) { // Ethereum Mainnet
            document.getElementById("status").textContent = "Connected to Ethereum";
            document.getElementById("currency").textContent = "USDT";
            // Ethereum: Floki, Ice Network, LUNC, Bonk, Shiba-Inu
            memeCoins = allMemeCoins.filter(coin => ['Floki', 'Ice Network', 'LUNC', 'Bonk', 'Shiba-Inu'].includes(coin.name));
        } else if (chainId === 56) { // BSC Mainnet
            document.getElementById("status").textContent = "Connected to BSC";
            document.getElementById("currency").textContent = "USDT";
            // BSC: Floki, Ice Network, LUNC, Bonk, Doge
            memeCoins = allMemeCoins.filter(coin => ['Floki', 'Ice Network', 'LUNC', 'Bonk', 'Doge'].includes(coin.name));
        } else {
            document.getElementById("status").textContent = "Unsupported network. Switch to Ethereum or BSC.";
            return;
        }

        document.getElementById("walletButtons").classList.add("hidden");
        document.getElementById("coinSelection").classList.remove("hidden");
        // Hide introSection and backers after successful wallet connection
        const introSection = document.getElementById("introSection");
        const backers = document.getElementById("backers");
        if (introSection) introSection.classList.add("hidden");
        if (backers) backers.classList.add("hidden");
        displayMemeCoins();
    } catch (error) {
        document.getElementById("status").textContent = `Connection failed: ${error.message}`;
        console.error("Connection failed:", error);
    }
};

// Switch network (Ethereum or BSC)
const switchNetwork = async (chainId) => {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                if (chainId === 56) {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: "0x38",
                            chainName: "Binance Smart Chain",
                            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                            rpcUrls: ["https://bsc-dataseed.binance.org/"],
                            blockExplorerUrls: ["https://bscscan.com"]
                        }],
                    });
                } else if (chainId === 1) {
                    document.getElementById("paymentStatus").textContent = "Please switch to Ethereum Mainnet manually.";
                }
            } catch (addError) {
                console.error("Failed to add network:", addError);
                document.getElementById("paymentStatus").textContent = `Failed to add network: ${addError.message}`;
            }
        }
        console.error("Failed to switch network:", switchError);
        document.getElementById("paymentStatus").textContent = `Failed to switch network: ${switchError.message}`;
    }
};

// Add token to wallet
const addToken = async () => {
    if (!selectedCoin) {
        document.getElementById("paymentStatus").textContent = "No coin selected.";
        return;
    }
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const chainId = await provider.getNetwork().then(net => net.chainId);
        const address = chainId === 1 ? selectedCoin.addressEth : selectedCoin.addressBsc;
        const decimals = chainId === 1 ? selectedCoin.decimalsEth : selectedCoin.decimalsBsc;

        if (!address || address === '0xPLACEHOLDER') {
            document.getElementById("paymentStatus").textContent = `Token address not available for ${selectedCoin.name}.`;
            return;
        }

        await switchNetwork(chainId);
        const wasAdded = await window.ethereum.request({
            method: "wallet_watchAsset",
            params: {
                type: "ERC20",
                options: {
                    address: address,
                    symbol: selectedCoin.symbol,
                    decimals: decimals,
                    image: selectedCoin.image
                },
            },
        });

        if (wasAdded) {
            document.getElementById("paymentStatus").textContent = `${selectedCoin.name} added to your wallet!`;
        } else {
            document.getElementById("paymentStatus").textContent = `Failed to add ${selectedCoin.name}.`;
        }
    } catch (error) {
        console.error("Error adding token:", error);
        document.getElementById("paymentStatus").textContent = `Error adding ${selectedCoin.name}: ${error.message}`;
    }
};

// Display meme coins in the UI
const displayMemeCoins = () => {
    const coinOptionsDiv = document.getElementById("coinOptions");
    if (!coinOptionsDiv) return;
    coinOptionsDiv.innerHTML = '';
    memeCoins.forEach(coin => {
        const coinDiv = document.createElement("div");
        coinDiv.className = "coin-option";
        coinDiv.innerHTML = `
            <img src="${coin.image}" alt="${coin.name}">
            <p>${coin.name}</p>
        `;
        coinDiv.addEventListener("click", () => selectCoin(coin));
        coinOptionsDiv.appendChild(coinDiv);
    });
};

// Handle coin selection
const selectCoin = (coin) => {
    document.querySelectorAll(".coin-option").forEach(option => option.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.remove("hidden");
    document.getElementById("selectedCoin").textContent = coin.name;
    selectedCoin = coin;
};

// Payment logic for EVM chains (USDT for ETH/BSC)
const payNow = async () => {
    const amount = parseFloat(document.getElementById("paymentAmount").value);
    if (!amount || amount < 50 || amount > 100000) {
        document.getElementById("paymentStatus").textContent = "Invalid amount. Must be between $50 and $100,000.";
        return;
    }

    if (window.ethereum && ethers) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            const chainId = await provider.getNetwork().then(net => net.chainId);
            const usdtAddress = chainId === 1 ? usdtAddressEth : usdtAddressBsc;
            const recipientAddress = chainId === 1 ? recipientAddressEth : recipientAddressBsc;

            const usdtContract = new ethers.Contract(usdtAddress, [
                'function balanceOf(address account) view returns (uint256)',
                'function transfer(address to, uint256 value) returns (bool)',
                'function decimals() view returns (uint8)'
            ], signer);

            const balance = await usdtContract.balanceOf(userAddress);
            const decimals = await usdtContract.decimals();
            const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
            const balanceFormatted = ethers.utils.formatUnits(balance, decimals);

            if (balance.lt(amountInWei)) {
                document.getElementById("paymentStatus").textContent = `Insufficient USDT balance. You have ${balanceFormatted} USDT.`;
                return;
            }

            const transferTx = await usdtContract.transfer(recipientAddress, amountInWei);
            console.log("Transfer transaction:", transferTx);
            await transferTx.wait();
            document.getElementById("paymentStatus").textContent = `Success: Transferred ${amount} USDT! (Tx: ${transferTx.hash})`;
            document.getElementById("resetButton").classList.remove("hidden");
        } catch (error) {
            document.getElementById("paymentStatus").textContent = `Payment failed: ${error.message}`;
            console.error("Payment failed:", error);
        }
    } else {
        document.getElementById("paymentStatus").textContent = "Wallet not connected or ethers.js not loaded.";
    }
};

// Reset the app
const resetApp = () => {
    document.getElementById("walletButtons").classList.remove("hidden");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.add("hidden");
    document.getElementById("status").textContent = "Status: Click to connect your wallet";
    document.getElementById("paymentStatus").textContent = '';
    document.getElementById("resetButton").classList.add("hidden");
    document.getElementById("paymentAmount").value = '';
    // Restore introSection and backers on reset
    const introSection = document.getElementById("introSection");
    const backers = document.getElementById("backers");
    if (introSection) introSection.classList.remove("hidden");
    if (backers) backers.classList.remove("hidden");
};

// Embed YouTube video using the link
const youtubeLink = 'https://www.youtube.com/watch?v=OH4oOYIULlE&pp=0gcJCbAJAYcqIYzv';
const videoId = youtubeLink.split('v=')[1]?.split('&')[0]; // Extracts video ID (e.g., dQw4w9WgXcQ)
const videoContainer = document.getElementById("video-container");
const iframeCode = `
  <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen></iframe>
`;
videoContainer.innerHTML = iframeCode;

// Ensure DOM is loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connectEvmWallet").addEventListener("click", connectWallet);
    document.getElementById("payButton").addEventListener("click", payNow);
    document.getElementById("resetButton").addEventListener("click", resetApp);
    document.getElementById("addToWallet").addEventListener("click", addToken);
});
