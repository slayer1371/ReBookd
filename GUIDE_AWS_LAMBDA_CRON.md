# Deploying AWS Lambda + EventBridge Cron for Rebookd

This guide explains how to set up a scheduled cron job using AWS Lambda and EventBridge (formerly CloudWatch Events) to trigger your Next.js API route (`/api/cron/expire`).

## Prerequisites
- An AWS Account
- Your deployed Rebookd application URL (e.g., `https://rebookd.vercel.app`)
- The `CRON_SECRET` from your `.env` file

## Step 1: Create the Lambda Function

1.  Log in to the **AWS Management Console**.
2.  Navigate to **Lambda**.
3.  Click **Create function**.
4.  Select **Author from scratch**.
5.  **Function name**: `rebookd-cron-expire`
6.  **Runtime**: `Node.js 20.x` (or latest LTS)
7.  Click **Create function**.

## Step 2: Deploy the Code

1.  In the **Code source** section of your new function:
2.  Open `index.mjs` (or `index.js`).
3.  Copy and paste the content from `scripts/lambda-cron.js` in your project into the AWS editor.
    *   *Note: If AWS created `index.mjs`, allow the rename or just paste the content. The script uses CommonJS (`require`), so `index.js` is preferred, or standard Node.js runtime handles it.*
4.  Click **Deploy**.

## Step 3: Configure Environment Variables

1.  Go to the **Configuration** tab -> **Environment variables**.
2.  Click **Edit**.
3.  Add the following variables:
    *   **Key**: `API_URL`
    *   **Value**: `https://<YOUR_DEPLOYED_DOMAIN>/api/cron/expire`
    *   **Key**: `CRON_SECRET`
    *   **Value**: `<YOUR_CRON_SECRET_FROM_ENV>`
4.  Click **Save**.

## Step 4: Test the Function

1.  Go to the **Test** tab.
2.  Create a new test event (name it `TestCron`, verify "Hello World" template is fine, we don't use the event body).
3.  Click **Test**.
4.  You should see a successful execution and a response from your API.
    *   *Check your API logs (e.g., Vercel logs) to confirm the hit.*

## Step 5: Schedule with EventBridge

1.  Go to the **Configuration** tab -> **Triggers**.
2.  Click **Add trigger**.
3.  Select **EventBridge (CloudWatch Events)**.
4.  **Rule**: Create a new rule.
5.  **Rule name**: `rebookd-cron-schedule`
6.  **Rule type**: **Schedule expression**.
7.  **Schedule expression**:
    *   Run every hour: `rate(1 hour)`
    *   Run every day at midnight UTC: `cron(0 0 * * ? *)`
8.  Click **Add**.

## Done!
Your Lambda function will now trigger your API route on the defined schedule, safely processing expirations using your secure token.
