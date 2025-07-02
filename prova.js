document.addEventListener('DOMContentLoaded', () => {
    const quizFormEl = document.getElementById('quiz-form');
    const quizFormContainer = document.getElementById('quiz-form-container');
    const resultsEl = document.getElementById('quiz-results');
    const scoreEl = document.getElementById('quiz-score');
    const answerKeyEl = document.getElementById('quiz-answer-key');

    // Tenta carregar os dados da prova do armazenamento local
    const quizDataJSON = localStorage.getItem('customQuizData');
    if (!quizDataJSON) {
        quizFormContainer.innerHTML = '<h2>Erro</h2><p>Nenhum dado de prova encontrado. Por favor, gere uma nova prova a partir da página principal do curso.</p>';
        return;
    }

    const quizData = JSON.parse(quizDataJSON);
    
    // Constrói o formulário da prova
    quizFormEl.innerHTML = quizData.questions.map((q, index) => `
        <li>
            <div class="exercise">
                <p class="prompt">${index + 1}. ${q.prompt}</p>
                <div class="options">
                    ${q.options ? q.options.map((opt, i) => `
                        <label>
                            <input type="radio" name="q${index}" value="${i}" required> ${opt}
                        </label>
                    `).join('') : `<input type="text" name="q${index}" required>`}
                </div>
            </div>
        </li>
    `).join('');

    // Evento de envio do formulário
    quizFormContainer.addEventListener('submit', (event) => {
        event.preventDefault();
        
        let score = 0;
        const answerKeyHTML = quizData.questions.map((q, index) => {
            const formData = new FormData(quizFormContainer);
            const userAnswer = formData.get(`q${index}`);
            const isCorrect = userAnswer == q.correctAnswerIndex;
            
            if (isCorrect) {
                score++;
            }

            return `
                <div class="result-question">
                    <p><b>Questão ${index + 1}:</b> ${q.prompt}</p>
                    <p>Sua resposta: <span class="${isCorrect ? 'correct-answer' : 'wrong-answer'}">${q.options[userAnswer]}</span></p>
                    ${!isCorrect ? `<p>Resposta correta: <span class="correct-answer">${q.options[q.correctAnswerIndex]}</span></p>` : ''}
                    <p><small><i>Explicação: ${q.explanation}</i></small></p>
                </div>
            `;
        }).join('');

        // Exibe os resultados
        scoreEl.textContent = `Sua nota foi: ${score} de ${quizData.questions.length} (${((score / quizData.questions.length) * 100).toFixed(1)}%)`;
        answerKeyEl.innerHTML = answerKeyHTML;
        resultsEl.style.display = 'block';
        quizFormContainer.style.display = 'none'; // Esconde o formulário

        // Limpa os dados para não reutilizar a prova
        localStorage.removeItem('customQuizData');
    });
});
