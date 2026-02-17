# AWS Lambda + EventBridge Cron Setup

This guide details how to replace the Vercel Cron job with an AWS Lambda function triggered by Amazon EventBridge (formerly CloudWatch Events). This architecture gives you more control over execution and logging.

## Prerequisites
- AWS Account
- Deployed URL of your Rebookd application (e.g., `https://rebookd.vercel.app`)
- `CRON_SECRET` from your `.env` file

---

## Step 1: Create the Lambda Function

This function will act as a "pinger," sending an authenticated POST request to your Next.js API route.

1.  Log in to the **AWS Console** and navigate to **Lambda**.
2.  Click **Create function**.
3.  Select **Author from scratch**.
4.  **Function name**: `rebookd-expire-cron`
5.  **Runtime**: `Node.js 20.x` (or latest)
6.  **Architecture**: `arm64` (cheaper/faster) or `x86_64`
7.  Click **Create function**.

### Add Code
In the **Code source** section, paste the following into `index.mjs`:

```javascript
// index.mjs
export const handler = async (event) => {
  const url = process.env.API_URL;
  const secret = process.env.CRON_SECRET;

  if (!url || !secret) {
    // If not set, try checking event payload
    // const { API_URL, CRON_SECRET } = event;
    throw new Error("Missing API_URL or CRON_SECRET environment variables");
  }

  console.log(`Triggering cron job at: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API responded with ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error("Cron failed:", error);
    throw error; // Cause Lambda to fail so EventBridge retries/alerts if configured
  }
};
```

### Configure Environment Variables
1.  Go to the **Configuration** tab -> **Environment variables**.
2.  Click **Edit**.
3.  Add the following:
    *   `API_URL`: "https://your-production-domain.com/api/cron/expire"
    *   `CRON_SECRET`: "[Your CRON_SECRET from .env]"
4.  Click **Save**.

### Adjust Timeout
1.  Go to **Configuration** -> **General configuration**.
2.  Click **Edit**.
3.  Increase **Timeout** to `10 seconds`.
4.  Click **Save**.

---

## Step 2: Configure EventBridge (Amazon EventBridge Scheduler)

This creates the recurring schedule.

1.  Navigate to **Amazon EventBridge**.
2.  Select **Schedules** from the left sidebar (under "Scheduler").
    *   *Note: "Rules" is the older way; "Scheduler" is newer and preferred.*
3.  Click **Create schedule**.
4.  **Schedule name**: `rebookd-expire-trigger`
5.  **Schedule pattern**:
    *   **Occurrence**: Recurring schedule
    *   **Schedule type**: Rate-based schedule
    *   **Rate expression**: `5` **minutes**
6.  Click **Next**.
7.  **Target API**: Select **AWS Lambda**.
8.  **Invoke**: Select `rebookd-expire-cron`.
9.  Click **Next**, then **Next** again (review settings), and **Create schedule**.

---

## Step 3: Verify & Cleanup

1.  Trigger the Lambda manually via the **Test** tab in Lambda Console to verify access.
2.  Check CloudWatch Logs in the **Monitor** tab.
3.  Once verified, remove the Vercel cron configuration from `vercel.json` to prevent duplicate execution.

```json
// remove this section from vercel.json
"crons": [
    {
        "path": "/api/cron/expire",
        "schedule": "*/5 * * * *"
    }
]
```
