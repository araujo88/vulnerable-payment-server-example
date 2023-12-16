# vulnerable-payment-server-example

A vulnerable payment server example and a fix. DON'T use in production!

## Server vulnerable to race condition

This is a basic example of a payment server that demonstrates a vulnerability to double spending. It's important to remember that this code is for LEARNING purposes only and should NOT be used in a production environment!

Here's a basic example:

```javascript
const express = require("express");
const app = express();
app.use(express.json());

// Mock database
let userBalance = {
  user1: 100,
};

// Asynchronous function to process payment
async function processPayment(user, amount) {
  console.log(`Processing payment for ${user}: $${amount}`);

  // Simulate a delay which can lead to race conditions
  await new Promise((resolve) => setTimeout(resolve, 1000));

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
app.post("/pay", async (req, res) => {
  const { user, amount } = req.body;

  if (!user || amount == null) {
    return res.status(400).send("Invalid request");
  }

  const success = await processPayment(user, amount);

  if (success) {
    res.send(`Payment of $${amount} processed for ${user}`);
  } else {
    res.status(400).send("Payment failed");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

This server has a race condition vulnerability. If multiple requests are sent in quick succession to the `/pay` endpoint for the same user, `processPayment` might not have the updated balance when it checks for sufficient funds. This can lead to the user's balance being deducted more than it should, simulating a double spending issue.

To test this, you can use a tool like Postman or a simple script to send multiple asynchronous requests to the `/pay` endpoint at the same time and observe how the balance is incorrectly updated.

## How to fix

JvaScript and Node.js do not have built-in mutex or semaphore constructs like some other languages do. We can, however, simulate a mutex using async/await patterns and Promises, or use a library that provides a mutex or semaphore implementation.

We'll use the `async-mutex` library which provides a Mutex class that can be used to ensure that only one piece of code can access the critical section at a time. Here's how we can refactor the code to use `async-mutex`:

```javascript
const express = require("express");
const app = express();
const { Mutex } = require("async-mutex");
app.use(express.json());

// Mock database
let userBalance = {
  user1: 100,
};

// Mutex for each user to prevent race conditions
const mutex = new Mutex();

// Asynchronous function to process payment
async function processPayment(user, amount) {
  return mutex.runExclusive(async () => {
    console.log(`Processing payment for ${user}: $${amount}`);

    // Simulate a delay which can lead to race conditions
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (userBalance[user] >= amount) {
      // Deduct amount
      userBalance[user] -= amount;
      console.log(`Payment processed for ${user}: $${amount}`);
      return true;
    } else {
      console.log(`Insufficient balance for ${user}`);
      return false;
    }
  });
}

// Endpoint to handle payment
app.post("/pay", async (req, res) => {
  const { user, amount } = req.body;

  if (!user || amount == null) {
    return res.status(400).send("Invalid request");
  }

  const success = await processPayment(user, amount);

  if (success) {
    res.send(`Payment of $${amount} processed for ${user}`);
  } else {
    res.status(400).send("Payment failed");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

With `async-mutex`, we wrap the critical section in `mutex.runExclusive()`. This ensures that the critical section is not executed concurrently by multiple operations. When one operation is executing the critical section, any other operations trying to enter will wait until the mutex is released. This prevents the race condition in the payment processing logic.
