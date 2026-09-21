import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { sendFCMPushNotification } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập (401 Unauthorized)" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, title, message, body: notifBody, icon, url = "/work", data } = body;

    const finalTitle = title || "🔔 Văn Phòng Chuỗi SKECHERS";
    const finalBody = message || notifBody || "Bạn có thông báo mới từ hệ thống.";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "FCM registration token là bắt buộc" },
        { status: 400 }
      );
    }

    const result = await sendFCMPushNotification({
      token,
      title: finalTitle,
      body: finalBody,
      icon: icon || "/icon.png",
      url,
      data,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Đã gửi thông báo Firebase Cloud Messaging thành công",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Gửi Firebase Push thất bại" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi server" },
      { status: 500 }
    );
  }
}
