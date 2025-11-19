'use client';

import { DashboardLayout } from '@/shared/components/layouts/DashboardLayout';

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}