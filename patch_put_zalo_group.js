const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(filePath, 'utf8');

const anchor = `// 🔔 GỬI THÔNG BÁO ZALO
            if (status === 'CONFIRMED' || status === 'CANCELLED') {
              try {
                const ZALO_NOTIFY_GROUPS = ["zgr-985a598e79e190bfc9f0"];`;

if (code.includes(anchor)) {
  const replacementStr = `// 🔔 GỬI THÔNG BÁO ZALO
            if (status === 'CONFIRMED' || status === 'CANCELLED') {
              try {
                let notifyGroupId = "zgr-14b10f10137ffa21a36e";
                try {
                  const confRow = await env.DB.prepare("SELECT confirmed_group_chat_id FROM zalo_config WHERE id = 'main'").first();
                  if (confRow && confRow.confirmed_group_chat_id) {
                    notifyGroupId = confRow.confirmed_group_chat_id;
                  }
                } catch(e) {}
                const ZALO_NOTIFY_GROUPS = [notifyGroupId];`;
                
  code = code.replace(anchor, replacementStr);
  fs.writeFileSync(filePath, code);
  console.log("Successfully replaced ZALO_NOTIFY_GROUPS in PUT handler");
} else {
  console.log("Anchor not found in worker/index.js");
}
