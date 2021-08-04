export interface payment{
    card_number: string;
    holder_name: string;
    expiration_year: string;
    expiration_month: string;
    cvv2: string;
}

export interface payment_request{
    source_id: string;
    method: string;
    amount: number;
    description: string;
    device_session_id: string;
    customer: {
      name: string;
      last_name: string;
      phone_number: string;
      email: string;
    };
}