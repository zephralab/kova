ALTER TABLE firms DROP COLUMN IF EXISTS razorpay_key_id, DROP COLUMN IF EXISTS razorpay_key_secret;
ALTER TABLE users DROP COLUMN IF EXISTS personal_razorpay_key_id, DROP COLUMN IF EXISTS personal_razorpay_key_secret;
ALTER TABLE milestone_payments DROP COLUMN IF EXISTS razorpay_payment_id, DROP COLUMN IF EXISTS razorpay_order_id;
DROP FUNCTION IF EXISTS get_razorpay_credentials(user_uuid UUID);
DROP FUNCTION IF EXISTS record_milestone_payment(payment_uuid UUID, razorpay_ord_id TEXT, razorpay_pay_id TEXT);