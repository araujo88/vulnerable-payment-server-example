const express = require('express');
const app = express();
app.use(express.json());

// Mock database
let userBalance = {
    'user1': 100
};

// Asynchronous function to process payment
async function processPayment(user, amount) {
    console.log(`Processing payment for ${user}: $${amount}`);
    
    // Simulate a delay which can lead to race conditions
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userBalance[user] >= amount) {
        // Deduct amount
        userBalance[user] -= amount;
        console.log(`Payment processed for ${user}: $${amount}`);
        return true;
    } else {
        console.log(`Insufficient balance for ${user}`);
        return false;
    }
}

// Endpoint to handle payment
app.post('/pay', async (req, res) => {
    const { user, amount } = req.body;

    if (!user || amount == null) {
        return res.status(400).send('Invalid request');
    }

    const success = await processPayment(user, amount);

    if (success) {
        res.send(`Payment of $${amount} processed for ${user}`);
    } else {
        res.status(400).send('Payment failed');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

