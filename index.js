/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type } from '@google/genai';

interface Flashcard {
  term: HTMLDivElement;
  definition: HTMLDivElement;
}

const topicInput = document.getElementById('topicInput') as HTMLTextAreaElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const flashcardsContainer = document.getElementById('flashcardsContainer') as HTMLDivElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

// Inicialização da API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

generateButton.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  
  if (!topic) {
    errorMessage.textContent = 'Por favor, insira um tema ou termos.';
    flashcardsContainer.innerHTML = '';
    return;
  }

  // UI State: Loading
  errorMessage.innerHTML = '<span class="loading-spinner"></span> A pensar nos teus cartões...';
  flashcardsContainer.innerHTML = '';
  generateButton.disabled = true;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gera 6 a 10 flashcards educativos e precisos sobre o tema: "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: {
                type: Type.HTMLDivElement,
                description: 'O conceito ou pergunta.',
              },
              definition: {
                type: Type.HTMLDivElement,
                description: 'A explicação concisa.',
              },
            },
            required: ["term", "definition"],
          },
        },
      },
    });

    const flashcards: Flashcard[] = JSON.parse(response.text || '[]');

    if (flashcards.length > 0) {
      errorMessage.textContent = '';
      flashcards.forEach((flashcard) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'flashcard';
        cardDiv.setAttribute('role', 'button');
        cardDiv.setAttribute('tabindex', '0');

        cardDiv.innerHTML = `
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="term">${flashcard.term}</div>
            </div>
            <div class="flashcard-back">
              <div class="definition">${flashcard.definition}</div>
            </div>
          </div>
        `;

        cardDiv.addEventListener('click', () => {
          cardDiv.classList.toggle('flipped');
        });

        // Acessibilidade: Tecla Enter para virar
        cardDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cardDiv.classList.toggle('flipped');
          }
        });

        flashcardsContainer.appendChild(cardDiv);
      });
    } else {
      errorMessage.textContent = 'Não conseguimos gerar cartões para este tema. Tenta ser mais específico.';
    }
  } catch (error: any) {
    console.error('Erro Gemini API:', error);
    errorMessage.textContent = 'Erro ao ligar ao servidor. Verifica se a tua API Key está configurada na Vercel.';
  } finally {
    generateButton.disabled = false;
  }
});
