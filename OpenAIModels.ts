export class OpenAIModels {
  openAIKey: string;

  constructor(key: string) {
    this.openAIKey = key;
  }

  async get() {
    if(!this.openAIKey) throw new Error('OpenAI Key is not provided');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIKey}`,
        }
      });

      if(!response.ok) throw new Error(response.statusText)

      const jsonResponse = await response.json();

      return jsonResponse.data;
    } catch(error) {
      return error;
    }
  }
}