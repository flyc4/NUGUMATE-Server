const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
require('dotenv').config()  
const axios = require("axios");  
const MongoClient = require("mongodb").MongoClient;  
const moment = require('moment')

const client = new MongoClient(process.env.db_url, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
});
let database

const createConn = async () => {
  await client.connect();
  database = client.db('database');  
}; 
const connection = async function(){  
  if (!client.isConnected()) { 
      // Cold start or connection timed out. Create new connection.
      try {
          await createConn(); 
          console.log("connection completed")
      } catch (e) { 
          res.json({
              error: e.message,
          });
          return;
      }
  }    
}

// 월간 일기 조회
const Search_Monthly_Diary = async function(req, res) {
  console.log('Diary/Search_Monthly_Diary 호출됨.');
  await connection()  
       
  let currentyear = new Date().getFullYear(); 
  let currentmonth = new Date().getMonth();

  //사용자 입력 값
  const paramUserId = req.body.userid;
  const paramYear = req.body.year||currentyear; 
  const paramMonth = req.body.month||currentmonth; 
  
  //입력 받은 paramYear 과 parmaMonth 를 기준으로 조회 시작/끝 날짜를 설정
  const startdate = paramYear + "-" + paramMonth + "-" + "01";  
  const enddate = moment(startdate).endOf('month').format('YYYY-MM-DD');    
  const ISOstartdate = utils.GetISODate(startdate)
  const ISOenddate = utils.GetISODate(enddate)

  console.log('paramUserId: ',paramUserId);
  console.log('paramYear: ',paramYear);
  console.log('paramMonth: ',paramMonth); 
  console.log('ISOstartdate: ',ISOstartdate); 
  console.log('ISOenddate: ',ISOenddate); 
  
  if (database){       
    database.collection('users').findOne({UserId: paramUserId},
      function(err,user){
        if(err){
          console.log("Diary/Search_Monthly_Diary에서 사용자 조회 중 에러 발생: " + err.stack) 
          res.end() 
          return
        }  
        if(!user){
          console.log("Diary/Search_Monthly_Diary에서 사용자 조회 불가");
          res.json({msg: "missing"}); 
          return;
        }
        database.collection('diaries').find(
          {
            UserId: paramUserId, 
            Date: {$gte: ISOstartdate, $lte: ISOenddate} 
          }).toArray(
          function(err,diaries){ 
            if(err){
              console.log("Diary/Search_Monthly_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
            }   
            //조회된 일기가 없을 경우
            if(diaries.length<=0){ 
              console.log("No diary found");  
              res.json({'msg': 'empty'});
              res.end();
              return;
            } 
            // 조회한 일기들을 context 변수에 저장
            let context = { Diary: [{ Date: ' ', Contents: ' '}]}
            diaries.forEach(function(diary){
              context.Diary.push({
                Date: moment(diary.Date).format('YYYY-MM-DD'),
                Contents: diary.Contents
              })
            })
            context.Diary.splice(0,1); 
            res.json(context);
            res.end();
            return;
          }); //database.DiaryModel.find 닫기
        });//database.UserModel.findOne 닫기 
}//if(database) 닫기  
  else {  
    console.log("Diary/Search_Monthly_Diary 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
  };//Search_Monthly_Diary 닫기    

// 일간 일기 조회
const Search_Daily_Diary = async function(req, res) {
  console.log('Diary/Search_Daily_Diary 호출됨.');
  await connection()  
       
  //사용자 입력 값
  const paramUserId = req.body.userid;
  const paramDate = req.body.date; 
  const ISOparamDate = utils.GetISODate(paramDate);
  const ISOparamNextDate = utils.GetISODate(moment(ISOparamDate).add(1,'days').format('YYYY-MM-DD')); 

  console.log('paramUserId: ',paramUserId);
  console.log('ISOparamDate: ',ISOparamDate);
  console.log('ISOparamNextDate: ',ISOparamNextDate);

  if (database){       
    
    database.collection('users').findOne({UserId: paramUserId},
      function(err,user){
        if(err){
          console.log("Diary/Search_Monthly_Diary에서 사용자 조회 중 에러 발생: " + err.stack) 
          res.end(); 
          return;
        }  
        if(!user){
          console.log("Diary/Search_Daily_Diary에서 사용자 조회 불가")  
          res.json({msg: "missing"}); 
          return;
        }
        database.collection('diaries').find(
          {
            UserId: paramUserId, 
            Date: {$gte: ISOparamDate, $lt: ISOparamNextDate} 
          }).toArray(
          function(err,diary){ 
            if(err){
              console.log("Diary/Search_Daily_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
            }  
            //조회된 일기가 없을 경우
            if(diary.length<=0){ 
              console.log("No diary found");  
              res.json({'msg': 'empty'});
              res.end();
              return;
            } 
            // 조회한 일기를 context 변수에 저장
            let context = { Diary: { Date: diary[0].Date, Contents: diary[0].Contents}}
            res.json(context);
            res.end();
            return;
          }); //database.DiaryModel.find 닫기
        });//database.UserModel.findOne 닫기 
}//if(database) 닫기  
  else {  
    console.log("Diary/Search_Daily_Diary 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
};//Search_Daily_Diary 닫기

// 일간 일기 upsert
const Save_Diary = async function(req, res) {
  console.log('Diary/Save_Diary 호출됨.');
  await connection()  
       
  //사용자 입력 값
  const paramUserId = req.body.userid;
  const paramDate = req.body.date; 
  const ISOparamDate = utils.GetISODate(paramDate); 
  const paramContents = req.body.contents;

  console.log('paramUserId: ',paramUserId);
  console.log('ISOparamDate: ',ISOparamDate);
  console.log('paramContents: ',paramContents);

  if (database){       
    database.collection('users').findOne({UserId: paramUserId},
      function(err,user){
        if(err){
          console.log("Diary/Save_Diary에서 사용자 조회 중 에러 발생: " + err.stack) 
          res.end(); 
          return;
        }  
        if(!user){
          console.log("Diary/Save_Diary에서 사용자 조회 불가")  
          res.json({msg: "missing"}); 
          return;
        } 

        //미리 정의한 모델 불러오기 
        let db = req.app.get('database');
        let newdiary = new db.DiaryModel({
          User_id: user._id, 
          Date: paramDate, 
          Contents: paramContents
        });  
       database.collection('diaries').updateOne({Date: newdiary.Date, UserId: newdiary.UserId}
        ,newdiary,{upsert: true},function(err){
        if(err){
          console.log("Diary/Save_Diary에서 일기 저장 중 에러 발생: " + err.stack) 
          res.end(); 
          return;
        } 
        res.json({"msg": "completed"});  
        res.end();
        return;  
       }); 
       
    });//database.UserModel.findOne 닫기  

}//if(database) 닫기  
  else {  
    console.log("Diary/Search_Daily_Diary 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
};//Save_Diary 닫기 

// 일간 일기 삭제
const Delete_Diary = async function(req, res) {
  console.log('Diary/Delete_Diary 호출됨.');
  await connection();  
       
  //사용자 입력 값
  const paramUserId = req.body.userid;
  const paramDate = req.body.date; 
  const ISOparamDate = utils.GetISODate(paramDate);
  const ISOparamNextDate = utils.GetISODate(moment(ISOparamDate).add(1,'days').format('YYYY-MM-DD')); 

  console.log('paramUserId: ',paramUserId);
  console.log('ISOparamDate: ',ISOparamDate);
  console.log('ISOparamNextDate: ',ISOparamNextDate);

  if (database){       
    
    database.collection('users').findOne({UserId: paramUserId},
      function(err,user){
        if(err){
          console.log("Diary/Delete_Diary에서 사용자 조회 중 에러 발생: " + err.stack) 
          res.end(); 
          return;
        }  
        if(!user){
          console.log("Diary/Delete_Diary에서 사용자 조회 불가")  
          res.json({msg: "missing"}); 
          return;
        }
        database.collection('diaries').deleteOne(
          {
            User_id: user._id, 
            Date: {$gte: ISOparamDate, $lt: ISOparamNextDate} 
          },
          function(err){ 
            if(err){
              console.log("Diary/Delete_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
            }  
            res.json({"msg": "completed"});
            res.end();
            return;
          }); //database.DiaryModel.find 닫기
        });//database.UserModel.findOne 닫기 
}//if(database) 닫기  
  else {  
    console.log("Diary/Delete_Diary 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
};//Delete_Diary 닫기

module.exports.Search_Monthly_Diary = Search_Monthly_Diary;
module.exports.Search_Daily_Diary = Search_Daily_Diary;  
module.exports.Save_Diary = Save_Diary;
module.exports.Delete_Diary = Delete_Diary;