declare module 'flutterwave-node-v3' {
  interface RaveOptions {
    public_key: string;
    secret_key: string;
    encryption_key?: string;
    production?: boolean;
  }

  interface CardChargeData {
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    currency: string;
    amount: number;
    email: string;
    tx_ref: string;
    redirect_url?: string;
    [key: string]: any;
  }

  interface AccountChargeData {
    account_number: string;
    bank_code: string;
    amount: number;
    currency: string;
    tx_ref: string;
    email: string;
    [key: string]: any;
  }

  interface PaymentPlanData {
    amount: number;
    name: string;
    interval: string;
    duration?: number;
    [key: string]: any;
  }

  interface SubscriptionData {
    plan: string;
    customer: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  }

  class Rave {
    constructor(options: RaveOptions);

    Card: {
      charge(data: CardChargeData): Promise<any>;
      validate(data: any): Promise<any>;
      verify(txRef: string): Promise<any>;
      tokenizedCharge(data: any): Promise<any>;
    };

    Account: {
      charge(data: AccountChargeData): Promise<any>;
      validate(data: any): Promise<any>;
      verify(txRef: string): Promise<any>;
    };

    PaymentPlan: {
      create(data: PaymentPlanData): Promise<any>;
      fetch(id: string): Promise<any>;
      update(id: string, data: any): Promise<any>;
    };

    Subscription: {
      create(data: SubscriptionData): Promise<any>;
      fetch(id: string): Promise<any>;
      cancel(id: string): Promise<any>;
    };

    Misc: {
      verifyTransaction(txRef: string): Promise<any>;
    };
  }

  const flutterwave: typeof Rave;
  export = flutterwave;
}
