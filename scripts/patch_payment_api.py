import os

api_path = r"d:\Work\TBS II\web\src\app\api\business-trips\payment-status\route.ts"
with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the update query and return response with notification payload
old_update = """    // Update DB
    await db.prepare('UPDATE business_trips SET payment_status = ?, payment_notes = ? WHERE id = ?')
            .bind(newStatus, notes || trip.payment_notes || null, tripId)
            .run();

    return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái', newStatus });"""

new_update = """    // Update DB
    await db.prepare('UPDATE business_trips SET payment_status = ?, payment_notes = ? WHERE id = ?')
            .bind(newStatus, notes || trip.payment_notes || null, tripId)
            .run();

    // Determine notification message
    let notifTitle = "";
    let notifMessage = "";
    let notifTarget = "";

    if (newStatus === 'SUBMITTED') {
      notifTitle = "Thanh toán: Có đơn mới gửi quyết toán";
      notifMessage = `Đơn công tác "${trip.id.substring(0,6)}" vừa gửi chứng từ cho Kế toán.`;
      notifTarget = "KT-001"; // Or send to a role 'ACCOUNTANT' if the browserNotification supported role targets. For now, Kế Toán is KT-001.
    } else if (newStatus === 'REJECTED_DOCS') {
      notifTitle = "Thanh toán: Chứng từ bị từ chối";
      notifMessage = `Kế toán yêu cầu sửa lại chứng từ đơn "${trip.id.substring(0,6)}". Lý do: ${notes}`;
      notifTarget = trip.creator.split(" - ")[0];
    } else if (newStatus === 'PAID') {
      notifTitle = "Thanh toán: Đã chuyển khoản";
      notifMessage = `Kế toán đã chuyển khoản cho chuyến công tác "${trip.id.substring(0,6)}". Ghi chú: ${notes}`;
      notifTarget = trip.creator.split(" - ")[0];
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Đã cập nhật trạng thái', 
      newStatus,
      notify: notifTitle ? { title: notifTitle, message: notifMessage, targetUser: notifTarget, link: `/business-trip?id=${tripId}` } : null
    });"""

content = content.replace(old_update, new_update)

with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added notifications to payment-status API")
