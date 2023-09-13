const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'))
app.use('/public', express.static('public'))
app.set('view engine', 'ejs');
require('dotenv').config()

var db;

MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function (에러, client) {
  if (에러) return console.log(에러)

  db = client.db('todoApp');
  
  app.listen(process.env.PORT, function () {
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

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(요청, 응답){
  응답.redirect('/')
});

app.get('/fail', function(요청, 응답){
  응답.render('fail.ejs');
});

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('member').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    console.log("ID,PW,결과", 입력한아이디, 입력한비번, 결과)
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })

    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('member').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
}); 


app.get('/mypage', 로그인했니, function (요청, 응답) {
  console.log(요청.user.id);
  console.log(요청.session);

  응답.render('mypage.ejs', { 사용자: 요청.user });
});

function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    console.log(요청.user)
    next()
  }
  else {
    응답.send('로그인이 되지 않았습니다. 로그인 해주세요.')
  }
}

app.get('/search', (요청, 응답) => {
  console.log('요청쿼리', 요청.query);

  var 검색조건 = [
    {
      $search: {
        index: 'search-index',
        text: {
          query: 요청.query.value,
          path: '할일'  // 제목날짜 둘다 찾고 싶으면 ['할일', '날짜']
        }
      }
    },
    { $sort : { _id: 1 } }
  ] 

  // find함수 대신 aggregate 함수 사용. 이전 사용코드: find( { 할일 : {$regex : 요청.query.value } })
  db.collection('post').aggregate(검색조건).toArray((에러, 결과) =>{
    console.log('결과', 결과);
    응답.render('search.ejs', { search: 결과 });
  });
});

app.get('/register', (요청, 응답) => {
  응답.render('register.ejs');
});

app.post('/register', (요청, 응답) => {
  
  var info = { id: 요청.body.id, pw: 요청.body.pw, 이름: 요청.body.name }
  console.log('회원가입정보', info.id, info.pw, info.이름);

  if (info.id == null || info.id == "") { 
    console.log('아이디를 입력해주세요');
    return;
  }
  if (info.pw == null || info.pw == "" ) { 
    console.log('비밀번호를 입력해주세요');
    return; 
  }
  if (info.이름 == null || info.이름 == "") { 
    console.log('이름을 넣어주세요');
    return;
  }
  
  db.collection('member').insertOne(info, (에러, 결과) => {
    if(에러) console.log(에러);
    // console.log(결과);
  });

  응답.render('index.ejs');
});

app.post('/idcheck', (요청, 응답) => {

  var 아이디 = 요청.body.id;
  console.log(요청.body.id)

    db.collection('member').findOne({ id: 아이디 }, (에러, 결과) => {
      if(에러) console.log('에러', 에러)

        console.log('결과', 결과)
        // 'DB에 없는 아이디 입니다. 사용할 수 있는 아이디임'
        응답.render('register.ejs', { post : 1 });
      
    });

});