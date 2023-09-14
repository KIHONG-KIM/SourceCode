var router = require('express').Router();

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
 });
 
 router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
 }); 

 // 뷰티용품 쇼핑 페이지
router.get('/beauty', function(요청, 응답){
    응답.send('뷰티용품 쇼핑할 수 있는 페이지입니다.');
 });
 
 // 펫용품 쇼핑 페이지
 router.get('/pet', function(요청, 응답){
  응답.send('펫용품 쇼핑할 수 있는 페이지입니다.');
 })

 module.exports = router;