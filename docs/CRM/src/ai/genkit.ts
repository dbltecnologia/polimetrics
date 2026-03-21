
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// A chave de API do Google AI (Gemini) é lida da variável de ambiente GOOGLE_GENAI_API_KEY.
const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("A chave da API do Gemini não está definida. As chamadas para a IA irão falhar.");
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
  // O modelo padrão foi removido daqui para ser definido dinamicamente nas chamadas.
});
