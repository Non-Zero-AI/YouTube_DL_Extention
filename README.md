# YouTube Downloader Pro Chrome Extension

A Chrome extension that allows users to download YouTube videos in MP4, MP3, or text format with high fidelity.

## Features

- Modern, gradient, glowing download button overlay on YouTube videos
- Side panel interface with multiple download options
- Download videos in MP4, MP3, or text format
- High fidelity download capability (downloads the highest quality available)
- User account system with free and premium tiers
- Subscription service with monthly ($5) and yearly ($20) plans
- Admin capabilities with promo code generation

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and ready to use

## Usage

1. Navigate to any YouTube video
2. Click the "Download" button that appears on the video
3. The side panel will open with download options
4. Select your preferred formats (MP4, MP3, text) and quality
5. Click "Download" to start the download process

## Free vs Premium

### Free Tier
- Limited to 5 downloads per month
- High quality only
- Basic features

### Premium Tier
- Unlimited downloads
- All quality options (High, Medium, Low)
- Faster downloads
- Priority support

## Payment Integration

This extension uses Stripe for payment processing with automated webhook integration:

### Webhook Endpoints

The extension is configured with two webhook endpoints:

1. **Customer Signup Webhook**: `https://nonzeroai.app.n8n.cloud/webhook-test/fdfcd990-6772-4556-8d9e-10d41311737d`
   - Triggered when a new customer creates an account
   - Sends customer details (email, password, isAdmin, createdAt) to the database

2. **Stripe Payment Webhook**: `https://nonzeroai.app.n8n.cloud/webhook-test/b5579850-7159-4ec9-8119-76aee0b0edb3`
   - Triggered when a customer initiates a subscription purchase
   - Sends payment details (email, plan, price, name, interval, timestamp)

### How It Works

1. When a user signs up, their details are automatically sent to the signup webhook
2. When a user clicks to subscribe, the payment webhook is triggered
3. The user is redirected to the Stripe checkout page
4. After successful payment, the subscription is activated
5. The user can immediately enjoy premium features

### Setting Up Stripe Integration for Production

To customize the Stripe integration for your own use:

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Set up your products and pricing in the Stripe dashboard
3. Update the webhook URLs in background.js:
   - Replace `WEBHOOK_SIGNUP` with your customer signup webhook URL
   - Replace `WEBHOOK_STRIPE_PAYMENT` with your Stripe payment webhook URL
4. Update the API_BASE_URL in background.js to point to your backend
5. Implement proper backend endpoints to handle the actual Stripe integration

## Admin Features

As an admin, you have additional capabilities:

1. Generate promo codes for free 24-hour access
2. Monitor user subscriptions and downloads
3. Access to all premium features without a subscription

To access admin features, log in with an admin account (configured in your backend).

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `background.js`: Background service worker
- `content.js`: Content script for YouTube pages
- `content.css`: Styles for the download button
- `popup.html/js/css`: Extension popup UI
- `sidepanel.html/js/css`: Side panel UI
- `stripe-checkout.html`: Simulated Stripe checkout page
- `icons/`: Extension icons

### Building for Production

1. Update the version number in manifest.json
2. Replace the API_BASE_URL with your production API endpoint
3. Package the extension for the Chrome Web Store

## License

See the LICENSE file for details.
