var router = require('express').Router();

const { OpenAI } = require('openai');

const apiKey = process.env.GPT_API_KEY; // 자신의 OpenAI API 키로 대체하세요

const openai = new OpenAI({ 
  apiKey: apiKey 
});

router.get('/chatgpt', (요청, 응답) => {

  응답.render('chatgpt.ejs');
});

router.post('/chatgpt', (요청, 응답) => {

  const question = 요청.body.question
  console.log(question)

  async function main() {
    const completion  = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: question }],
    });
    console.log(completion.choices);
    응답.send({answer: completion.choices }) ;

  }

  // 클라이언트에게 데이터 되돌려주기
  // main(질문);
  main()

});

module.exports = router;