var router = require('express').Router();


/** 쓰기 Page **/

router.get('/write', function(요청, 응답){
  응답.render('write.ejs')
});

// 추가하기 페이지의 추가하기 기능
router.post('/add', function(요청, 응답){

  // 파인드원
  db.collection('counter').findOne( { name : '게시물갯수' }, function(에러, 결과){
    if(에러) console.log("파인드원 에러:", 에러); // 에러 로그

    var 게시물갯수 = 결과.totalPost;
    console.log("게시물갯수:", 게시물갯수);
    // console.log(요청.user.id);
    console.log(요청.session);

    // 인서트원 
    db.collection('post').insertOne( { _id: 게시물갯수 + 1 , 할일 : 요청.body.title, 날짜 : 요청.body.date, 글쓴이: 요청.user.이름} , function(에러, 결과){
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

router.get('/edit/:id', function(요청, 응답){
  db.collection('post').findOne({_id: parseInt(요청.params.id) }, function(에러, 결과){
    console.log("결과",결과)
    응답.render('edit.ejs', { data: 결과 })
  });
});

router.put('/edit', function(요청, 응답){

  console.log("요청바디:", 요청.body, 요청.user)

  if (요청.body.writer == 요청.user.이름) {
    db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { 할일: 요청.body.title, 날짜: 요청.body.date } }, function(에러, 결과){
      if(에러) console.log("에러",에러);
      console.log('결과:');
      응답.redirect('/list');
    });
  } else {
    응답.send('당신은 글 작성자가 아닙니다.')
  }
});

router.delete('/delete', function(요청, 응답){ 

  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  console.log(요청.body._id);

  if (요청.body.글쓴이 == 요청.user.이름) {
    db.collection('post').deleteOne( 요청.body , function(){
      console.log('삭제완료');
      응답.status(200).send({ message : '성공했습니다.' });
     })
  }
});

// 파일 업로드

let multer = require('multer');
var today = new Date();

var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    
    cb(null, file.originalname)
  }

});

var upload = multer({storage : storage});

router.get('/upload', function(요청, 응답){
  응답.render('upload.ejs')
});

router.post('/upload', upload.single("image"), function(요청, 응답){
  응답.send('업로드 완료')
});

router.get('/chat', function(요청, 응답){
  응답.render('chat.ejs')
});

module.exports = router;