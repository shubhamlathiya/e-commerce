const Wallet = require('../../models/payments/walletModel');
const Order = require('../../models/orders/orderModel');
const PaymentTransaction = require('../../models/payments/paymentTransactionModel');

/**
 * Get user wallet
 */
exports.getUserWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        transactions: []
      });
      await wallet.save();
    }
    
    return res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving wallet',
      error: error.message
    });
  }
};

/**
 * Add funds to wallet (admin only)
 */
exports.addFunds = async (req, res) => {
  try {
    const { userId, amount, reference } = req.body;
    const adminId = req.user.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        transactions: []
      });
    }
    
    // Add transaction
    wallet.transactions.push({
      type: 'credit',
      amount,
      reference: reference || `Added by admin ${adminId}`,
      createdAt: new Date()
    });
    
    // Update balance
    wallet.balance += amount;
    
    await wallet.save();
    
    return res.status(200).json({
      success: true,
      message: 'Funds added successfully',
      data: {
        userId,
        newBalance: wallet.balance,
        addedAmount: amount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error adding funds',
      error: error.message
    });
  }
};

/**
 * Deduct funds from wallet (admin only)
 */
exports.deductFunds = async (req, res) => {
  try {
    const { userId, amount, reference } = req.body;
    const adminId = req.user.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Find wallet
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Add transaction
    wallet.transactions.push({
      type: 'debit',
      amount,
      reference: reference || `Deducted by admin ${adminId}`,
      createdAt: new Date()
    });
    
    // Update balance
    wallet.balance -= amount;
    
    await wallet.save();
    
    return res.status(200).json({
      success: true,
      message: 'Funds deducted successfully',
      data: {
        userId,
        newBalance: wallet.balance,
        deductedAmount: amount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deducting funds',
      error: error.message
    });
  }
};

/**
 * Process wallet payment for order
 */
exports.processWalletPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, amount } = req.body;
    
    // Validate order
    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to user'
      });
    }
    
    // Check if payment is already completed
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment for this order is already completed'
      });
    }
    
    // Determine payment amount
    const paymentAmount = amount || order.totals.grandTotal;
    
    // Find wallet
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Check balance
    if (wallet.balance < paymentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        data: {
          walletBalance: wallet.balance,
          requiredAmount: paymentAmount
        }
      });
    }
    
    // Create payment transaction
    const transaction = new PaymentTransaction({
      orderId,
      userId,
      paymentMethod: 'wallet',
      transactionId: `WAL${Date.now()}${Math.floor(Math.random() * 1000)}`,
      amount: paymentAmount,
      currency: 'INR', // Default currency, can be made dynamic
      status: 'success',
      responseData: {
        walletId: wallet._id
      }
    });
    
    await transaction.save();
    
    // Add wallet transaction
    wallet.transactions.push({
      type: 'debit',
      amount: paymentAmount,
      reference: `Payment for order ${order.orderNumber}`,
      createdAt: new Date()
    });
    
    // Update wallet balance
    wallet.balance -= paymentAmount;
    await wallet.save();
    
    // Update order payment status
    order.paymentStatus = 'paid';
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Wallet payment processed successfully',
      data: {
        orderId,
        transactionId: transaction.transactionId,
        amount: paymentAmount,
        newWalletBalance: wallet.balance
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error processing wallet payment',
      error: error.message
    });
  }
};

/**
 * Process refund to wallet
 */
exports.processRefund = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const adminId = req.user.id;
    
    // Validate order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const userId = order.userId;
    
    // Determine refund amount
    const refundAmount = amount || order.totals.grandTotal;
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        transactions: []
      });
    }
    
    // Create refund transaction
    const transaction = new PaymentTransaction({
      orderId,
      userId,
      paymentMethod: 'wallet',
      transactionId: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
      amount: refundAmount,
      currency: 'INR', // Default currency, can be made dynamic
      status: 'refund',
      responseData: {
        reason: reason || 'Refund processed by admin',
        processedBy: adminId
      }
    });
    
    await transaction.save();
    
    // Add wallet transaction
    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      reference: `Refund for order ${order.orderNumber}: ${reason || 'Refund processed'}`,
      createdAt: new Date()
    });
    
    // Update wallet balance
    wallet.balance += refundAmount;
    await wallet.save();
    
    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully to wallet',
      data: {
        orderId,
        userId,
        refundAmount,
        newWalletBalance: wallet.balance,
        transactionId: transaction.transactionId
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

/**
 * Get wallet transactions
 */
exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Find wallet
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    // Filter transactions by type if specified
    let transactions = wallet.transactions;
    if (type && ['credit', 'debit', 'refund'].includes(type)) {
      transactions = transactions.filter(t => t.type === type);
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: paginatedTransactions.length,
      total: transactions.length,
      totalPages: Math.ceil(transactions.length / limit),
      currentPage: parseInt(page),
      data: {
        balance: wallet.balance,
        transactions: paginatedTransactions
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving wallet transactions',
      error: error.message
    });
  }
};

/**
 * Get all wallets (admin only)
 */
exports.getAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20, minBalance, maxBalance } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (minBalance !== undefined) {
      query.balance = { $gte: parseFloat(minBalance) };
    }
    if (maxBalance !== undefined) {
      query.balance = { ...query.balance, $lte: parseFloat(maxBalance) };
    }
    
    const wallets = await Wallet.find(query)
      .sort({ balance: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Wallet.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: wallets.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: wallets
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving wallets',
      error: error.message
    });
  }
};