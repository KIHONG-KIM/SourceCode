var router = require('express').Router();

const { OpenAI } = require('openai');

const apiKey = process.env.GPT_API_KEY; // 자신의 OpenAI API 키로 대체하세요
const openai = new OpenAI({ apiKey: apiKey });

router.get('/chatgpt', (요청, 결과) => {

  결과.render('chatgpt.ejs');
});

router.post('/chatgpt', (요청, 응답) => {

  const { question } = 요청.body;
  console.log('요청.body', question ); // 클라이언트로부터 받은 데이터 출력

  async function main(message) {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });
    for await (const part of stream) {
      process.stdout.write(part.choices[0]?.delta?.content || '');
    }
  }

  // 클라이언트에게 데이터 되돌려주기
  main(요청.body.question);

  응답.json({
      message: '데이터를 성공적으로 받았습니다.',
      data: 요청.body
  });
});

module.exports = router;