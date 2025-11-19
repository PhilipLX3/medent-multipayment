'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Drawer, IconButton } from '@mui/material';
import { Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useAuthStore } from '@/shared/store/authStore';
import clsx from 'clsx';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';

const navigation = [
  { name: '決済一覧', href: '/payments' },
  { name: '新規決済依頼', href: '/payments/new' },
  { name: '契約一覧', href: '/contracts' },
];

const publicNavigation = [
  { name: '新規申込', href: '/applications/new' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Choose navigation based on authentication status
  const currentNavigation = isAuthenticated ? navigation : publicNavigation;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/projects" className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">
                  Medical Payment
                </Link>
              </div>
              <div className="hidden sm:ml-4 lg:ml-6 sm:flex sm:space-x-4 lg:space-x-8">
                {currentNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname === `${item.href}/`;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        isActive
                          ? 'border-primary-500 text-gray-900 font-bold'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-xs md:text-sm font-medium whitespace-nowrap'
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            {isAuthenticated && (
              <div className="hidden sm:ml-2 lg:ml-6 sm:flex sm:items-center">
                <Link
                  href="/settings/clinic"
                  className="p-1 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md mr-1 md:mr-3"
                  title="医院設定"
                >
                  <Cog6ToothIcon className="h-5 w-5 md:h-6 md:w-6" />
                </Link>
                <Menu as="div" className="relative ml-1 md:ml-3">
                  <div>
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <div className="flex items-center space-x-1 md:space-x-3">
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                          <p className="text-xs text-gray-500">Medical Payment</p>
                        </div>
                        <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs md:text-sm font-medium text-gray-600">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={clsx(
                              active ? 'bg-gray-100' : '',
                              'block w-full px-4 py-2 text-left text-sm text-gray-700'
                            )}
                          >
                            ログアウト
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            )}
            {!isAuthenticated && (
              <div className="hidden sm:ml-2 lg:ml-6 sm:flex sm:items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  ログイン
                </Link>
              </div>
            )}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={handleDrawerToggle}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { sm: 'none' },
            '& .MuiDrawer-paper': {
              width: '256px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <div className="flex flex-col h-full bg-white">
            {/* Close button */}
            <div className="flex justify-end p-4 border-b border-gray-200">
              <IconButton
                onClick={handleDrawerToggle}
                aria-label="Close menu"
                sx={{
                  color: 'rgb(156, 163, 175)',
                  '&:hover': {
                    backgroundColor: 'rgb(243, 244, 246)',
                    color: 'rgb(107, 114, 128)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </div>

            {/* User info */}
            {isAuthenticated && (
              <div className="border-b border-gray-200 px-4 py-5">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-gray-800 truncate">{user?.name}</div>
                    <div className="text-sm font-medium text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div className="flex-1 py-4">
              <div className="space-y-1 px-2">
                {currentNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname === `${item.href}/`;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleDrawerToggle}
                      className={clsx(
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-bold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'block rounded-md py-3 px-4 text-base font-medium transition-colors'
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>


            </div>

            {/* Logout button or Login button */}
            <div className="border-t border-gray-200 p-4">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleDrawerToggle();
                    handleLogout();
                  }}
                  className="w-full rounded-md bg-red-500 py-3 px-4 text-base font-medium text-white"
                >
                  ログアウト
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={handleDrawerToggle}
                  className="w-full inline-flex justify-center rounded-md bg-primary-600 py-3 px-4 text-base font-medium text-white hover:bg-primary-700"
                >
                  ログイン
                </Link>
              )}
            </div>
          </div>
        </Drawer>
      </nav>

      <main className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;