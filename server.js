const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.use("/public", express.static("public"));
app.set("view engine", "ejs");
require("dotenv").config();
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

var db;

MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true },
  function (에러, client) {
    if (에러) return console.log(에러);
    db = client.db("todoApp");
    http.listen(process.env.PORT, function () {
      console.log("listening on 8080");
    });
  }
);

// Login Session
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/shop", require("./routes/shop.js"));
app.use("/", require("./routes/routes.js"));
app.use("/", require("./routes/chatgpt.js"));

app.get("/list", function (요청, 응답) {
  //디비에 저장된 모든 데이터를 꺼내오자.
  db.collection("post")
    .find()
    .toArray(function (에러, 결과) {
      console.log(결과);
      응답.render("list.ejs", { posts: 결과 });
    });
});

// 상세 페이지
app.get("/detail/:id", function (요청, 응답) {
  console.log(요청.params.id);
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("detail.ejs", { data: 결과 });
    }
  );
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("member").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          console.log("ID,PW,결과", 입력한아이디, 입력한비번, 결과);
          if (에러) return done(에러);
          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("member").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (요청, 응답) {
    응답.redirect("/");
  }
);

app.get("/fail", function (요청, 응답) {
  응답.render("fail.ejs");
});

function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    console.log('로그인했니?', 요청.user);
    next();
  } else {
    응답.send("로그인이 되지 않았습니다. 로그인 해주세요.");
    console.log('로그인했니? else');  
  }
}

app.get("/mypage", 로그인했니, function (요청, 응답) {
  console.log(요청.user.id);
  console.log(요청.session);

  응답.render("mypage.ejs", { 사용자: 요청.user });
});

app.get("/search", (요청, 응답) => {
  console.log("요청쿼리", 요청.query);

  var 검색조건 = [
    {
      $search: {
        index: "search-index",
        text: {
          query: 요청.query.value,
          path: "할일", // 제목날짜 둘다 찾고 싶으면 ['할일', '날짜']
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  // find함수 대신 aggregate 함수 사용. 이전 사용코드: find( { 할일 : {$regex : 요청.query.value } })
  db.collection("post")
    .aggregate(검색조건)
    .toArray((에러, 결과) => {
      console.log("결과", 결과);
      응답.render("search.ejs", { search: 결과 });
    });
});

app.get("/register", (요청, 응답) => {
  응답.render("register.ejs");
});

app.post("/register", (요청, 응답) => {
  var info = { id: 요청.body.id, pw: 요청.body.pw, 이름: 요청.body.name };
  console.log("회원가입정보", info.id, info.pw, info.이름);

  if (info.id == null || info.id == "") {
    console.log("아이디를 입력해주세요");
    return;
  }
  if (info.pw == null || info.pw == "") {
    console.log("비밀번호를 입력해주세요");
    return;
  }
  if (info.이름 == null || info.이름 == "") {
    console.log("이름을 넣어주세요");
    return;
  }

  db.collection("member").insertOne(info, (에러, 결과) => {
    if (에러) console.log(에러);
    // console.log(결과);
  });

  응답.render("index.ejs");
});

app.post("/idcheck", (요청, 응답) => {
  var 아이디 = 요청.body.id;
  console.log(요청.body.id);

  db.collection("member").findOne({ id: 아이디 }, (에러, 결과) => {
    if (에러) console.log("에러", 에러);

    console.log("결과", 결과);
    // 'DB에 없는 아이디 입니다. 사용할 수 있는 아이디임'
    응답.render("register.ejs", { post: 1 });
  });
});

app.get("/chat", 로그인했니, function (요청, 응답) {

  db.collection('chatroom').find( {member: 요청.user.이름}).toArray().then((결과) => {
    console.log(결과);
    응답.render('chat.ejs', { data: 결과 })
  })
});

// 채팅 메시지 추가하기
app.post("/chatmsg", (요청, 응답) => {
  
  console.log("요청.body", 요청.body)
  var 추가하기 = {
    parent: 요청.body.parent,
    content: 요청.body.content
  }
  
  db.collection('chat').insertOne(추가하기), (에러, 결과) => {
    console.log('추가성공', 결과)
  }

});

app.get("/chat/:parentid", 로그인했니, function (요청, 응답) {

  // 응답.writeHead(200, {
  //   "Connection": "keep-alive",
  //   "Content-Type": "text/event-stream",
  //   "Cache-Control": "no-cache",
  // });

  //   db.collection('chat').find( { parent: 요청.params.parentid }).toArray()
  //   .then( (결과) => {
  //     console.log(결과);
  //     console.log('파라미터', 요청.params.parentid , "params");

  //     응답.write('event: test \n');
  //     응답.write('data:' + JSON.stringify(결과) + '\n\n');
  //   });

  });

app.post("/chatroom", 로그인했니, (요청, 응답) => {
  console.log("아이디확인하기", 요청.body.id, 요청.user.이름);

  var 추가할거 = {
    member: [요청.user.이름, 요청.body.id],
    name: "최고의채팅방",
    date: new Date(),
  };
  
  console.log("추가할거", 추가할거);
  db.collection("chatroom").insertOne(추가할거).then(function(결과){
    console.log(결과);
    응답.send('저장완료')
  });
});

// 채팅

app.get('/socket', 로그인했니, function(요청, 응답){

  db.collection('chatroom').find( {member: 요청.user.이름}).toArray().then((결과) => {
    console.log(결과);
    응답.render('socket.ejs', { data: 결과 })
  })
});

io.on('connection', function(socket){

  console.log('유저 접속됨');
  socket.on('user-send', function(data){
    io.emit('broadcast', data)
    console.log(data);
  })

  socket.on('joinroom', function(data){
    socket.join("room1");
  });

  socket.on('room1-send', function(data){
    io.to("room1").emit('broadcast', data);
  });
  
});