const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const ObjectId = mongoose.Types.ObjectId;  
const utils = require('../config/utils'); 
require('dotenv').config()  
const axios = require("axios");  
const MongoClient = require("mongodb").MongoClient;  
const moment = require('moment'); 

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
};

// 월간 일기 조회
const Search_Monthly_Diary = async function(req, res) {
  console.log('Diary/Search_Monthly_Diary 호출됨.');
  await connection();  
       
  let currentyear = new Date().getFullYear(); 
  let currentmonth = new Date().getMonth() + 1;

  //사용자 입력 값
  const paramNuguName = req.query.nuguname||req.params.nuguname;
  const paramYear = req.query.year||req.params.year||currentyear; 
  let paramMonth = req.query.month||currentmonth; 
  
  if(paramMonth*1>=13){
    paramMonth = "01"
  } 
  else if(paramMonth*1<10){
    paramMonth = "0" + paramMonth 
  } 

  //입력 받은 paramYear 과 parmaMonth 를 기준으로 조회 시작/끝 날짜를 설정
  const startdate = moment(new Date(paramYear, paramMonth,0)).startOf('month').format('YYYY-MM-DD');//paramYear + "-" + paramMonth + "-" + "01";  
  const enddate = moment(startdate).endOf('month').format('YYYY-MM-DD');    
  const ISOstartdate = utils.GetISODate(startdate)
  const ISOenddate = utils.GetISODate(enddate)

  console.log('paramNuguName: ',paramNuguName);
  console.log('paramYear: ',paramYear);
  console.log('paramMonth: ',paramMonth); 
  console.log('ISOstartdate: ',ISOstartdate); 
  console.log('ISOenddate: ',ISOenddate); 
  
  if (database){       

  database.collection('diaries').find( 
    {
      NuguName: paramNuguName, 
      Date: {$gte: ISOstartdate, $lte: ISOenddate} 
    }).toArray(
    function(err,diaries){ 
      if(err){
        console.log("Diary/Search_Monthly_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
      }    
      // 조회한 일기들을 allcontext 변수에 저장
      //이런 형태: {"0000-01-01": {marked: true, contents: " "}, "0000-01-01": {marked: true, contents: " "} }
        let allcontext = {}; 
        let seperatecontext = {};
      diaries.forEach(function(diary){ 
        let date = moment(diary.Date).format('YYYY-MM-DD').toString();
        seperatecontext[date] = {marked: true, contents: diary.Contents} 
        Object.assign(allcontext,seperatecontext);
      });
      res.json(allcontext);
      res.end();
      return;
    }); //database.DiaryModel.find 닫기
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
  await connection();
       
  //사용자 입력 값
  const paramNuguName = req.query.nuguname;
  const paramDate = req.query.date; 
  const ISOparamDate = utils.GetISODate(paramDate);
  const ISOparamNextDate = utils.GetISODate(moment(ISOparamDate).add(1,'days').format('YYYY-MM-DD')); 

  console.log('paramNuguName: ',paramNuguName);
  console.log('ISOparamDate: ',ISOparamDate);
  console.log('ISOparamNextDate: ',ISOparamNextDate);

  if (database){       
    database.collection('diaries').findOne(
      {
        NuguName: paramNuguName, 
        Date: {$gte: ISOparamDate, $lt: ISOparamNextDate} 
      },
      function(err,diary){ 
        if(err){
          console.log("Diary/Search_Daily_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
        }   
        
        //조회된 일기가 없다면 빈 객체 전송 
        if(!diary){ 
          res.json({Diary: " "}); 
          res.end(); 
          return;
        }
        // 조회한 일기를 context 변수에 저장
        let context = { Diary: { Date: diary.Date, Contents: diary.Contents}}
        res.json(context);
        res.end();
        return;
      }); //database.DiaryModel.find 닫기 
  }//if(database) 닫기  
  else {  
    console.log("Diary/Search_Daily_Diary 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  }      
};//Search_Daily_Diary 닫기

const Save_Diary = async function(req, res) {
  console.log('Diary/Save_Diary 호출됨.');
  await connection();
       
  //사용자 입력 값
  const paramNuguName = req.body.nuguname;
  const paramDate = utils.GetISODate(req.body.date);
  const paramContents = req.body.contents; 
  const paramNextDate = utils.GetISODate(moment(paramDate).add(1,'days').format('YYYY-MM-DD'));

  console.log('paramNuguName: ',paramNuguName);
  console.log('paramDate: ',paramDate);
  console.log('paramContents: ',paramContents);

  if (database){       
    database.collection('users').findOne({NuguName: paramNuguName},
      async function(err,user){
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
        let Sentiment_Analysis=0;  
        axios.post(process.env.model_url + '/Get_Diary', {_id: user._id, Contents: paramContents}) 
          .then((response) => {       
              Sentiment_Analysis = response.data.result; 
              console.log("result: ",Sentiment_Analysis);

              let db = req.app.get('database');
              let newdiary = db.DiaryModel({
                NuguName: user.NuguName, 
                Date: paramDate,  
                Sentiment_Analysis: Sentiment_Analysis 
              }); 
              
              database.collection('diaries').findOneAndUpdate({Date: {$gte: paramDate, $lt: paramNextDate }, NuguName: newdiary.NuguName}
                ,newdiary,{upsert: true}, async function(err){
                  if(err){
                    console.log("Diary/Save_Diary에서 일기 저장 중 에러 발생: " + err.stack) 
                    res.end(); 
                    return; 
                  }     
                  res.json({msg: "completed"}); 
                  res.end(); 
                  return;
              });   
            })// axios 닫기 
          .catch(( err ) => {
            console.log("Diary/Save_Daily_Diary에서 Sentiment_Analysis 요청 중 에러 발생: " + err.stack); 
            return; 
          });
      });//database.collection(users).findOne 닫기 
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
  const paramNuguName = req.body.nuguname;
  const paramDate = utils.GetISODate(req.body.date); 
  const paramNextDate = utils.GetISODate(moment(paramDate).add(1,'days').format('YYYY-MM-DD')); 

  console.log('paramNuguName: ',paramNuguName);
  console.log('paramDate: ', paramDate);
  console.log('paramNextDate: ', paramNextDate);

  if (database){       
    
      database.collection('diaries').deleteOne(
        {
          NuguName: paramNuguName, 
          Date: {$gte: paramDate, $lt: paramNextDate} 
        },
        async function(err){ 
          if(err){
            console.log("Diary/Delete_Diary에서 일기 조회 중 에러 발생: "+ err.stack); 
            res.end(); 
            return;
          }   
          res.json({"msg": "completed"});
          res.end();
          return;
            }); //collection('diaries').deleteOne 닫기 
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
