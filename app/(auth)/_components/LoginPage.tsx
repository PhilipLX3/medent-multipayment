'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/shared/store/authStore';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: 'admin@test-dental.jp',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      // デフォルトで新規決済依頼画面に遷移
      router.push('/payments/new');
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Medical Payment
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          管理画面へログイン
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email" className="sr-only">
              メールアドレス
            </label>
            <input
              {...register('email', {
                required: 'メールアドレスを入力してください',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: '有効なメールアドレスを入力してください',
                },
              })}
              type="email"
              autoComplete="email"
              className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="メールアドレス"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              パスワード
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'パスワードを入力してください',
                  minLength: {
                    value: 6,
                    message: 'パスワードは6文字以上で入力してください',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="relative block w-full rounded-md border-0 py-1.5 px-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="パスワード"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 z-20"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    aria-hidden="true"
                  />
                ) : (
                  <EyeIcon
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <LockClosedIcon
                className="h-5 w-5 text-primary-500 group-hover:text-primary-400"
                aria-hidden="true"
              />
            </span>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>
      </form>
    </>
  );
}