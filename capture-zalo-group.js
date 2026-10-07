#!/usr/bin/env node
/**
 * Script Capture Zalo Group Chat ID riêng biệt cho Terminal
 * 
 * CÁCH CHẠY TRỰC TIẾP TỪ TERMINAL:
 *   1. node capture-zalo-group.js
 *   2. node capture-zalo-group.js YOUR_BOT_TOKEN
 *   3. npm run capture-zalo
 */

const { captureZaloGroupChatId } = require('./scripts/capture-zalo-group');

if (require.main === module) {
  captureZaloGroupChatId();
}

module.exports = { captureZaloGroupChatId };
