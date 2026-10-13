# -*- coding: utf-8 -*-
import subprocess
import os
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev"

PAGES = [
    ("hinh_5_1_giao_dien_trang_chu_portal.png", f"{BASE_URL}/"),
    ("hinh_5_2_giao_dien_khung_chien_luoc_1_5_2.png", f"{BASE_URL}/1-5-2"),
    ("hinh_5_3_giao_dien_workspace_hub.png", f"{BASE_URL}/work"),
    ("hinh_5_4_giao_dien_kanban_my_tasks.png", f"{BASE_URL}/work/my-tasks"),
    ("hinh_5_5_giao_dien_gemba_walk_5s.png", f"{BASE_URL}/work/gemba"),
    ("hinh_5_6_giao_dien_kaizen_ie_queue.png", f"{BASE_URL}/work/ci"),
    ("hinh_5_7_giao_dien_mmtb_dashboard.png", f"{BASE_URL}/maintenance"),
    ("hinh_5_8_giao_dien_mmtb_machines_list.png", f"{BASE_URL}/maintenance/machines"),
    ("hinh_5_9_giao_dien_room_booking.png", f"{BASE_URL}/rooms"),
    ("hinh_5_10_giao_dien_business_trip.png", f"{BASE_URL}/business-trip"),
]

def capture_all():
    os.makedirs("images", exist_ok=True)
    for filename, url in PAGES:
        target_path = os.path.abspath(os.path.join("images", filename))
        print(f"Capturing: {url} -> {filename}")
        cmd = [
            CHROME_PATH,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            f"--screenshot={target_path}",
            "--window-size=1440,900",
            "--virtual-time-budget=5000",
            url
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if os.path.exists(target_path):
                size_kb = os.path.getsize(target_path) / 1024
                print(f"   [SUCCESS] Size: {size_kb:.1f} KB")
            else:
                print(f"   [FAILED] File not generated. Stderr: {res.stderr}")
        except Exception as e:
            print(f"   [ERROR] {e}")

if __name__ == "__main__":
    capture_all()
