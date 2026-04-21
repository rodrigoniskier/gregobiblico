import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // 1. Segurança: Só permitimos que o site envie dados (POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Apenas requisições POST são permitidas.' });
    }

    try {
        // 2. Pegamos a dúvida que o utilizador digitou no ecrã
        const { mensagem } = req.body;

        // 3. Acedemos à chave secreta (que vai ficar escondida na Vercel)
        // O "process.env" é como o servidor lê as Variáveis de Ambiente
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 4. Escolhemos o modelo do Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        // 5. Enviamos a mensagem para a IA e esperamos a resposta
        // Podemos dar um contexto para ele agir como um professor de grego!
// 5. Enviamos a mensagem para a IA e esperamos a resposta
        const prompt = `Aja como o 'EscribaIA', um professor didático, amigável e especialista em Grego Coinê Bíblico. Responda de forma clara e direta.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. NÃO use código LaTeX (como $\\sigma$, \\lambda, \\acute{\\upsilon}). Escreva as palavras gregas usando os caracteres gregos reais (ex: σ, λύω, ομαι).
2. NÃO use Markdown (como **, #, ---, ou tabelas markdown).
3. Estruture a sua resposta utilizando formatação HTML básica: use <b> para negrito, <br> para quebra de linha, e <ul> / <li> para listas de pontos.

Dúvida do aluno: "${mensagem}"`;        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textoIA = response.text();

        // 6. Devolvemos a resposta limpa para o seu site (Frontend)
        return res.status(200).json({ respostaIA: textoIA });

    } catch (error) {
        console.error("Erro ao comunicar com o Gemini:", error);
        return res.status(500).json({ error: 'Os pergaminhos estão ilegíveis agora. Tente novamente mais tarde.' });
    }
}
