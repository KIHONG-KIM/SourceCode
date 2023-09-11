const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'))

app.set('view engine', 'ejs');

const uri = "mongodb+srv://admin:qwer1234@cluster-applecode.e2qolmi.mongodb.net/?retryWrites=true&w=majority";

var db;

MongoClient.connect(uri, { useUnifiedTopology: true }, function (에러, client) {
  if (에러) return console.log(에러)

  db = client.db('todoApp');
  
  app.listen(8080, function () {
		console.log('listening on 8080')
	});

});

app.get('/', function(요청, 응답){
  응답.render('index.ejs')
});


app.get('/list', function(요청, 응답){

  //디비에 저장된 모든 데이터를 꺼내오자.
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
    응답.render('list.ejs', { posts : 결과 });
  });

});

// 뷰티용품 쇼핑 페이지
app.get('/beauty', function(요청, 응답){
    응답.send('뷰티용품 쇼핑할 수 있는 페이지입니다.');
});

// 펫용품 쇼핑 페이지
app.get('/pet', function(요청, 응답){
  응답.send('펫용품 쇼핑할 수 있는 페이지입니다.');
})

// 상세 페이지
app.get('/detail/:id', function(요청, 응답){
  console.log(요청.params.id)
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function(에러, 결과){
    console.log(결과);
    응답.render('detail.ejs', { data : 결과} );
  });

});

// 추가하기 페이지
app.get('/write', function(요청, 응답){
  응답.render('write.ejs')
});

// 추가하기 페이지의 추가하기 기능
app.post('/add', function(요청, 응답){

  // 파인드원
  db.collection('counter').findOne( { name : '게시물갯수' }, function(에러, 결과){
    if(에러) console.log("파인드원 에러:", 에러); // 에러 로그

    var 게시물갯수 = 결과.totalPost;
    console.log("게시물갯수:", 게시물갯수);

    // 인서트원
    db.collection('post').insertOne( { _id: 게시물갯수 + 1 , 할일 : 요청.body.title, 날짜 : 요청.body.date} , function(에러, 결과){
      if(에러) console.log("인서트원 에러:", 에러); // 에러 로그

      console.log("1" + 요청.body.title + "#", "2" + 요청.body.date + "#" , ' 이하 저장완료');

      // 카운트 추가 +1
      db.collection('counter').updateOne( { name : '게시물갯수'}, {$inc: { totalPost: 1 } } , function(에러, 결과){

        if(에러) console.log("게시물카운트 개수 에러:", 에러); // 에러 로그

      }); // 업데이트원
    }); // 인서트원
  }); //파인드원

    응답.send('전송완료 <p> <a href="/">홈으로</a>, <p> <a href="/write">일정 더 추가하기</a> ')
});

app.get('/edit/:id', function(요청, 응답){
  db.collection('post').findOne({_id: parseInt(요청.params.id) }, function(에러, 결과){
    console.log("결과",결과)
    응답.render('edit.ejs', { data: 결과 })
  });
});

app.put('/edit', function(요청, 응답){
  console.log("요청바디:", 요청.body, parseInt(요청.body._id),  요청.body.할일, 요청.body.날짜)

  db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { 할일: 요청.body.title, 날짜: 요청.body.date } }, function(에러, 결과){
    if(에러) console.log("에러",에러);
    console.log('결과:');

  });
  응답.redirect('/list');
  
});

app.delete('/delete', function(요청, 응답){ 
  //
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  console.log(요청.body._id);

   db.collection('post').deleteOne(요청.body, function(){
    console.log('삭제완료');
    응답.status(200).send({ message : '성공했습니다.' });
   })
});

// Login Session
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

app.get('/login', function(요청, 응답){
  응답.render('login.ejs');
});

app.post('/login', function(요청, 응답){
  db.collection('post').findOne({_id: 요청.params.id }, function(에러, 결과){
    console.log("결과",결과);
    응답.render('login.ejs');
  });
});