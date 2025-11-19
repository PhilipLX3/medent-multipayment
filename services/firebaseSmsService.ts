import { auth } from '@/shared/config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// import toast from 'react-hot-toast';

// Firebase SMS送信サービス
// 注意: Firebase AuthのSMS機能は主に認証用です
// 純粋なSMS送信にはFirebase Cloud Functionsが必要です

export const firebaseSmsService = {
  recaptchaVerifier: null as RecaptchaVerifier | null,

  // reCAPTCHAの初期化（SMS送信前に必要）
  initRecaptcha(elementId: string = 'recaptcha-container'): void {
    try {
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA resolved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            this.recaptchaVerifier = null;
          }
        });
      }
    } catch (error) {
      console.error('reCAPTCHA初期化エラー:', error);
    }
  },

  // SMS送信（認証コード付き）
  async sendVerificationSms(phoneNumber: string): Promise<any> {
    try {
      // 日本の電話番号形式に変換
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // reCAPTCHAが初期化されていない場合
      if (!this.recaptchaVerifier) {
        this.initRecaptcha();
      }

      // SMS送信
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        this.recaptchaVerifier!
      );

      console.log('SMS送信成功:', formattedPhone);
      return confirmationResult;
    } catch (error: any) {
      console.error('SMS送信エラー:', error);
      
      // エラーメッセージの処理
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('無効な電話番号です');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('送信制限に達しました。しばらく待ってから再試行してください');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS送信の上限に達しました');
      }
      
      throw error;
    }
  },

  // カスタムSMS送信（Cloud Functions経由）
  async sendCustomSms(phoneNumber: string, message: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Cloud Functionsのエンドポイントを呼び出す
      const response = await fetch('https://asia-northeast1-medent-9167b.cloudfunctions.net/sendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('SMS送信に失敗しました');
      }

      const result = await response.json();
      console.log('SMS送信結果:', result);
    } catch (error) {
      console.error('カスタムSMS送信エラー:', error);
      throw error;
    }
  },

  // 電話番号のフォーマット（国際形式）
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    // 日本の番号の場合、+81を付ける
    if (cleaned.startsWith('0')) {
      return `+81${cleaned.substring(1)}`;
    }
    
    if (!cleaned.startsWith('81') && !cleaned.startsWith('+')) {
      return `+81${cleaned}`;
    }
    
    if (cleaned.startsWith('81')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  },

  // 電話番号のバリデーション
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    
    // 日本の携帯電話番号パターン
    const mobilePattern = /^0[789]0\d{8}$/;
    
    // 国際番号形式の場合
    const internationalPattern = /^(\+)?81[789]0\d{8}$/;
    
    return mobilePattern.test(cleaned) || internationalPattern.test(phone);
  },

  // SMS送信制限の確認
  async checkSmsQuota(): Promise<{ remaining: number; limit: number }> {
    // Firebase AuthのSMS送信制限
    // 無料プラン: 10件/日
    // Blazeプラン: 10,000件/月（最初の10,000件は無料）
    
    return {
      remaining: 10, // 実際はFirebaseコンソールで確認
      limit: 10,
    };
  },
};