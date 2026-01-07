import { GoogleGenAI, Type } from '@google/genai';

const topicInput = document.getElementById('topicInput');
const generateButton = document.getElementById('generateButton');
const flashcardsContainer = document.getElementById('flashcardsContainer');
const errorMessage = document.getElementById('errorMessage');

// Inicialização da API usando a variável de ambiente process.env.API_KEY
// Nota: Em plataformas como Vercel/Hugging Face, esta variável é injetada durante o deploy.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

generateButton.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  
  if (!topic) {
    errorMessage.textContent = 'Por favor, insira um tema ou termos.';
    flashcardsContainer.innerHTML = '';
    return;
  }

  // Estado visual: Carregando
  errorMessage.innerHTML = '<span class="loading-spinner"></span> A preparar os teus cartões...';
  flashcardsContainer.innerHTML = '';
  generateButton.disabled = true;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gera entre 6 a 10 flashcards educativos sobre: "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: {
                type: Type.STRING,
                description: 'O conceito ou pergunta.',
              },
              definition: {
                type: Type.STRING,
                description: 'A explicação concisa.',
              },
            },
            required: ["term", "definition"],
          },
        },
      },
    });

    const flashcards = JSON.parse(response.text || '[]');

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

        cardDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cardDiv.classList.toggle('flipped');
          }
        });

        flashcardsContainer.appendChild(cardDiv);
      });
    } else {
      errorMessage.textContent = 'Não foram gerados cartões. Tente outro tema.';
    }
  } catch (error) {
    console.error('Erro:', error);
    errorMessage.textContent = 'Erro ao gerar cartões. Verifique se a sua API_KEY está configurada corretamente nas definições da plataforma (Vercel/Hugging Face).';
  } finally {
    generateButton.disabled = false;
  }
});