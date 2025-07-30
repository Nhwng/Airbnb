const axios = require('axios');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const { zalopayConfig } = require('../config/zalopayConfig');

const createZaloPayOrder = async (amount, orderId, userId) => {
    try {
        const transID = Math.floor(Math.random() * 1000000);
        const embed_data = {
            redirecturl: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/payment/callback` : 'http://localhost:5173/payment/callback'
        };
        const items = [];

        const order = {
            app_id: zalopayConfig.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: `user_${userId}_order_${orderId}`,
            app_time: Date.now(),
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: amount,
            callback_url: zalopayConfig.callback_url,
            description: `Payment for Room Booking Order #${orderId}`,
            bank_code: ''
        };

        const dataStr = `${zalopayConfig.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
        order.mac = CryptoJS.HmacSHA256(dataStr, zalopayConfig.key1).toString();

        const result = await axios.post(zalopayConfig.endpoint, null, { 
            params: order,
            timeout: 10000
        });
        
        console.log('ZaloPay API Response:', result.data);
        return {
            ...result.data,
            app_trans_id: order.app_trans_id
        };
    } catch (error) {
        console.error('ZaloPay API Error:', error);
        throw error;
    }
};

module.exports = { createZaloPayOrder };