# ZK Identity Vault

A privacy-preserving identity verification web application built with Next.js, Tailwind CSS, and the Reclaim Protocol SDK.

## Features

- **Zero-Knowledge Identity Verification**: Verify Gmail accounts without exposing personal data
- **Cryptographic Proof Generation**: Generate tamper-proof credentials using ZK proofs
- **Proof Verification**: Verify the authenticity of shared credentials
- **Privacy-First Design**: Beautiful dark theme with security-focused UI
- **Responsive Design**: Works seamlessly across all devices

## Getting Started

### Prerequisites

- Node.js 16+ 
- A Reclaim Protocol account and app credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
4. Add your Reclaim Protocol credentials to `.env.local`:
   ```
   NEXT_PUBLIC_RECLAIM_APP_ID=your_app_id_here
   NEXT_PUBLIC_RECLAIM_APP_SECRET=your_app_secret_here
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

### Verifying Your Identity

1. Navigate to the home page
2. Click "Verify My Gmail" 
3. Complete the OAuth flow in the popup window
4. Receive your zero-knowledge proof
5. Copy or share the proof as needed

### Verifying a Proof

1. Navigate to the `/verify` page
2. Paste a proof in the text area
3. Click "Verify Proof" to validate authenticity
4. View verification details and status

## Technical Architecture

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS with custom privacy-focused theme
- **Icons**: Lucide React
- **Zero-Knowledge Proofs**: Reclaim Protocol SDK
- **Deployment**: Static export compatible

## Security Features

- Zero-knowledge proof generation
- Cryptographic signature verification
- Witness attestation validation
- Tamper-proof credential storage
- Privacy-preserving verification flow

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.