import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('web/src/app/rooms/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the booking form JSX section
keywords = ['THÔNG TIN', 'Phòng họp', 'Tiêu đề', 'Người đặt', 'Người chủ trì', 'Khung giờ', 'Hình thức', 'Đăng ký đặt', 'bookingModal', 'showBookingModal', 'isBookingOpen', 'BookingForm', 'handleBooking']
for i, l in enumerate(lines, 1):
    for kw in keywords:
        if kw.lower() in l.lower():
            print(f"{i}: {l.rstrip()[:150]}")
            break
