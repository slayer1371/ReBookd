import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@rebookd.com";

interface BookingEmailData {
  to: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  appointmentTime: string;
  duration: number;
  originalPrice: string;
  discountPercent: number;
  paidAmount: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const formattedTime = new Date(data.appointmentTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `✅ Booking Confirmed — ${data.serviceName} at ${data.businessName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #111; color: #fff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
              <span style="font-size: 24px;">✅</span>
            </div>
            <h1 style="margin: 0; font-size: 22px; color: #fff;">Booking Confirmed!</h1>
          </div>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 4px; font-size: 18px; color: #fff;">${data.serviceName}</h2>
            <p style="margin: 0 0 16px; font-size: 14px; color: #a1a1aa;">${data.businessName}</p>

            <table style="width: 100%; font-size: 14px; color: #d4d4d8;">
              <tr>
                <td style="padding: 6px 0; color: #71717a;">📅 When</td>
                <td style="padding: 6px 0; text-align: right;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a;">⏱ Duration</td>
                <td style="padding: 6px 0; text-align: right;">${data.duration} min</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a;">📍 Where</td>
                <td style="padding: 6px 0; text-align: right;">${data.businessAddress}, ${data.businessCity}</td>
              </tr>
            </table>
          </div>

          <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #71717a; padding: 4px 0;">Original price</td>
                <td style="text-align: right; color: #a1a1aa; text-decoration: line-through; padding: 4px 0;">$${data.originalPrice}</td>
              </tr>
              <tr>
                <td style="color: #34d399; padding: 4px 0;">Rebookd discount (${data.discountPercent}%)</td>
                <td style="text-align: right; color: #34d399; padding: 4px 0;">🎉</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;"></td>
              </tr>
              <tr>
                <td style="color: #fff; font-weight: 600; font-size: 16px; padding: 4px 0;">You paid</td>
                <td style="text-align: right; color: #fff; font-weight: 700; font-size: 20px; padding: 4px 0;">$${data.paidAmount}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
            Questions? Reply to this email or contact ${data.businessName} directly.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return { success: false, error };
  }
}

interface BusinessNotificationData {
  to: string;
  businessName: string;
  serviceName: string;
  customerName: string;
  appointmentTime: string;
  paidAmount: string;
  platformFee: string;
}

export async function sendBusinessBookingNotification(data: BusinessNotificationData) {
  const formattedTime = new Date(data.appointmentTime).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const netRevenue = (Number(data.paidAmount) - Number(data.platformFee)).toFixed(2);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `🎉 New Booking — ${data.serviceName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #111; color: #fff; border-radius: 16px;">
          <h1 style="margin: 0 0 16px; font-size: 20px; color: #fff;">New Booking for ${data.businessName}!</h1>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #fff;">${data.serviceName}</p>
            <p style="margin: 0 0 4px; font-size: 14px; color: #a1a1aa;">👤 ${data.customerName}</p>
            <p style="margin: 0 0 4px; font-size: 14px; color: #a1a1aa;">📅 ${formattedTime}</p>
            <p style="margin: 0; font-size: 14px; color: #34d399;">💰 Revenue: $${netRevenue} (after $${data.platformFee} platform fee)</p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send business notification:", error);
    return { success: false, error };
  }
}

interface WatchlistNotificationData {
  to: string;
  businessName: string;
  serviceName: string;
  discountPercent: number;
  discountedPrice: string | number;
  originalPrice: string | number;
  dealUrl: string;
}

export async function sendWatchlistNotification(data: WatchlistNotificationData) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `🔔 ${data.discountPercent}% off at ${data.businessName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #111; color: #fff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 8px;">Watchlist Alert</p>
            <h1 style="margin: 0; font-size: 24px; color: #fff;">${data.businessName} just posted a deal!</h1>
          </div>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
              Save ${data.discountPercent}%
            </div>
            <h2 style="margin: 0 0 8px; font-size: 20px; color: #fff;">${data.serviceName}</h2>
            <div style="font-size: 24px; font-weight: 700; color: #fff;">
              $${data.discountedPrice} <span style="font-size: 16px; color: #71717a; text-decoration: line-through; font-weight: 400;">$${data.originalPrice}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${data.dealUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Book Now
            </a>
            <p style="margin-top: 16px; font-size: 12px; color: #52525b;">
              You received this because you are watching ${data.businessName}.
            </p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send watchlist notification:", error);
    return { success: false, error };
  }
}
