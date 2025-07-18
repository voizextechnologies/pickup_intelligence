export interface Officer {
  id: string;
  name: string;
  mobile: string;
  telegram_id: string;
  status: 'Active' | 'Suspended';
  registered_on: string;
  last_active: string;
  credits_remaining: number;
  total_credits: number;
  total_queries: number;
  avatar?: string;
}

export interface QueryRequest {
  id: string;
  officer_id: string;
  officer_name: string;
  type: 'OSINT' | 'PRO';
  input: string;
  source: string;
  result_summary: string;
  credits_used: number;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Pending';
}

export interface CreditTransaction {
  id: string;
  officer_id: string;
  officer_name: string;
  action: 'Renewal' | 'Deduction' | 'Top-up' | 'Refund';
  credits: number;
  payment_mode: string;
  remarks: string;
  timestamp: string;
}

export interface APIKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  status: 'Active' | 'Inactive';
  last_used: string;
  usage_count: number;
}

export interface LiveRequest {
  id: string;
  timestamp: string;
  officer: string;
  type: 'OSINT' | 'PRO';
  query: string;
  status: 'Processing' | 'Success' | 'Failed';
}

// Updated Phone Prefill V2 API Response Types
export interface PhonePrefillV2Response {
  response: {
    alternatePhone: Array<{
      serialNo: string;
      phoneNumber: string;
    }>;
    email: Array<{
      serialNo: string;
      email: string;
    }>;
    address: Array<{
      Seq: string;
      ReportedDate: string;
      Address: string;
      State: string;
      Postal: string;
      Type: string;
    }>;
    voterId: Array<{
      seq: string;
      IdNumber: string;
      ReportedDate: string;
    }>;
    passport: Array<{
      seq: string;
      passport: string;
      ReportedDate?: string;
    }>;
    drivingLicense: Array<{
      seq: string;
      IdNumber: string;
      ReportedDate: string;
    }>;
    PAN: Array<{
      seq: string;
      ReportedDate: string;
      IdNumber: string;
    }>;
    name: {
      fullName: string;
      firstName: string;
      lastName: string;
    };
    income: string;
    gender: string;
    age: string;
    dob: string;
  };
}

export interface PhonePrefillV2Request {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  consentFlag: boolean;
  consentTimestamp: number;
  consentIpAddress: string;
  consentMessageId: string;
}

export interface DashboardStats {
  total_officers: number;
  active_officers: number;
  total_queries_today: number;
  successful_queries: number;
  failed_queries: number;
  total_credits_used: number;
  revenue_today: number;
  average_response_time: number;
}