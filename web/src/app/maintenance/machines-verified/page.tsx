'use client';

import MachinesListView from '@/components/MachinesListView';

export default function MachinesVerifiedPage() {
  return (
    <MachinesListView
      navTitle="Danh Sách Kiểm Kê"
      heading="Danh Sách Máy Đã Kiểm Kê"
      mode="verifiedOnly"
    />
  );
}
