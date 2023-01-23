export class OpenAITextCompletion {
  openAIKey: string;
  log: boolean;

  constructor(key: string, log=false) {
    this.openAIKey = key;
    this.log = log;
  }

  async test(prompt: string) {
    return prompt;
  }

  async post(prompt: string) {
    const requestData = JSON.stringify({
      prompt: prompt,
      max_tokens: 256,
      model: 'text-davinci-003',
      temperature: 0.5,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      n: 1
    });

    if(!this.openAIKey) throw new Error('OpenAI Key is not provided');

    try {
      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIKey}`,
        },
        body: requestData
      });

      if(!response.ok) throw new Error(response.statusText)

      const jsonResponse = await response.json();

      if(!jsonResponse || !jsonResponse.choices || !jsonResponse.choices[0] || !jsonResponse.choices[0].text) {
        throw new Error('Invalid Response from OpenAI');
      }

      return jsonResponse.choices[0].text;
    } catch(error) {
      return error;
    }
  }
}


// export summarizeText(text: string) {
//   let prompt = `
//   Write a summary of the text.

//   Text:
//   """
//   ${text.trim()}
//   """

//   Summary:`.trim();

//   const summary = await openaiTextCompletion(prompt);

//   return summary;
// }
