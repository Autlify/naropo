 
// API Client for AI Integration
export class AIClient {
  private baseURL: string;
  private licenseKey: string;

  constructor(licenseKey: string, baseURL = 'https://api.yourplatform.com') {
    this.licenseKey = licenseKey;
    this.baseURL = baseURL;
  }

  async sendMessage(
    messages: any[],
    config: {
      provider: string;
      model: string;
      temperature: number;
      maxTokens: number;
      streaming: boolean;
    }
  ) {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.licenseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.streaming,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response;
  }
}