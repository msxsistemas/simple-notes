-- Delete test webhook
DELETE FROM webhooks WHERE id = '3687270a-94af-496f-84e0-10b1404b8f95';

-- Delete test API credential (the newest one we created)
DELETE FROM api_credentials WHERE id = 'ff102704-24be-4d8b-baf2-09173995c168';