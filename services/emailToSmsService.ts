// メール to SMS ゲートウェイサービス
// 各キャリアのメールアドレス経由でSMS送信（無料・即時利用可能）

interface CarrierGateway {
  name: string;
  domain: string;
  pattern: RegExp;
}

const CARRIER_GATEWAYS: CarrierGateway[] = [
  {
    name: 'docomo',
    domain: '@docomo.ne.jp',
    pattern: /^0[789]0(1|2|3|4|5|6|7|8|9)\d{7}$/, // ドコモの番号パターン
  },
  {
    name: 'au/UQ mobile',
    domain: '@ezweb.ne.jp',
    pattern: /^0[789]0(1|2|3|4|5|6|7|8|9)\d{7}$/, // auの番号パターン
  },
  {
    name: 'softbank',
    domain: '@softbank.ne.jp',
    pattern: /^0[789]0(1|2|3|4|5|6|7|8|9)\d{7}$/, // ソフトバンクの番号パターン
  },
  {
    name: 'rakuten',
    domain: '@rakumail.jp',
    pattern: /^0[789]0\d{8}$/, // 楽天モバイルの番号パターン
  },
];

export const emailToSmsService = {
  // キャリアを推定してメールアドレスを生成
  generateSmsEmail(phoneNumber: string, carrier?: string): string[] {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (carrier) {
      const gateway = CARRIER_GATEWAYS.find(g => g.name === carrier);
      if (gateway) {
        return [`${cleaned}${gateway.domain}`];
      }
    }
    
    // キャリアが不明な場合は全キャリアのアドレスを返す
    return CARRIER_GATEWAYS.map(gateway => `${cleaned}${gateway.domain}`);
  },

  // SMS送信用のmailtoリンクを生成
  generateMailtoLink(phoneNumber: string, message: string, carrier?: string): string {
    const emails = this.generateSmsEmail(phoneNumber, carrier);
    const subject = '決済申込みのご案内';
    const body = encodeURIComponent(message);
    
    // 複数のメールアドレスをBCCに設定
    return `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}&body=${body}`;
  },

  // ブラウザのメールクライアントを開いてSMS送信
  openEmailClient(phoneNumber: string, message: string, carrier?: string): void {
    const mailtoLink = this.generateMailtoLink(phoneNumber, message, carrier);
    window.location.href = mailtoLink;
  },

  // キャリア選択モーダル用のキャリアリスト取得
  getCarriers(): Array<{ value: string; label: string }> {
    return [
      { value: '', label: '不明（全キャリアに送信）' },
      { value: 'docomo', label: 'ドコモ' },
      { value: 'au/UQ mobile', label: 'au / UQ mobile' },
      { value: 'softbank', label: 'ソフトバンク / Y!mobile' },
      { value: 'rakuten', label: '楽天モバイル' },
    ];
  },

  // Web APIを使用した送信（サーバー側実装が必要）
  async sendViaApi(phoneNumber: string, message: string): Promise<void> {
    // この方法を使う場合は、バックエンドにメール送信機能が必要
    // nodemailerなどを使ってサーバーからメールを送信
    
    const response = await fetch('/api/v1/sms/email-gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        message,
        // メールアドレスリスト
        recipients: this.generateSmsEmail(phoneNumber),
      }),
    });

    if (!response.ok) {
      throw new Error('SMS送信に失敗しました');
    }
  },
};