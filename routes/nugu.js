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
}; 

//앱을 처음 켰을 때 NuguName이 할당 되지 않을 경우 할당.
const Assign_NuguName = async function(req, res) {
  console.log('Nugu/Assign_NuguName 호출됨.');
  await connection();  
  
  if (database){       
    database.collection('nugunames').findOne({Assigned: false},
      function(err,name){
        if(err){
          console.log("Nugu/Assign_NuguName에서 할당되지 않은 이름 조회 중 에러 발생: " + err.stack); 
          res.end(); 
          return;
        }  
        if(!name){
          console.log("이미 모든 이름이 할당 됨.")  
          res.end(); 
          return;
        }    
        console.log("nuguname: ", name.Name);
        database.collection('nugunames').findOneAndUpdate({_id: new ObjectId(name._id)},{$set: {Assigned: true}}, 
        function(err){
          if(err){
            console.log("Nugu/Assign_NuguName에서 Assigned 속성 업데이트 중 에러 발생: " + err.stack); 
            res.end(); 
            return;
          }   
          
          res.json({nuguname: name.Name});
          res.end();
          return;  
        }); 
      });//collection('users').findOne 닫기  
    }//if(database) 닫기  
    else {  
        console.log("Nugu/Assign_NuguName 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
    }      
};//Assign_NuguName 닫기   

//specifications: Server-Answer Data-Choose_and_Send_Answer
const Diary_Conversation = async function(req, res) {
    console.log('Nugu/Diary_Conversation 호출됨.');
    await connection();  
    
    //사용자 입력 값 
    console.log("Received parameters: ")
    console.log(req.body.action.parameters);
    const paramNuguName = req.body.action.parameters.NuguName.value;
    const paramPeriod = req.body.action.parameters.Period.value;    
  
    if (database){       
      database.collection('users').findOne({NuguName: paramNuguName},
        async function(err,user){
          if(err){
            console.log("Nugu/Diary_Conversation에서 사용자 조회 중 에러 발생: " + err.stack) 
            res.end(); 
            return;
          }  
          if(!user){
            console.log("Nugu/Diary_Conversation에서 사용자 조회 불가")  
            res.end(); 
            return;
          }    

          //Choose_Answer의 대상이 되는 period 와 그에 따른 sentiment 
          let sentiment = -1;
          req.body.nuguname = paramNuguName; 
          
          switch(paramPeriod){

            case "오늘": 
              await Calculate_Daily_Analysis(req,res);
              sentiment = user.Daily_Analysis;  
              break; 

            case "이번주": 

              req.body.startdate = utils.Get_First_Day_of_Current_Week(new Date());      
              await Calculate_Weekly_Analysis(req,res);
              sentiment = user.Weekly_Analysis; 
              break;
            
            case "이번달": 
              
              req.body.year = new Date().getFullYear();
              req.body.month = new Date().getMonth() + 1;
              await Calculate_Monthly_Analysis(req,res);
              sentiment = user.Monthly_Analysis; 
              break; 
            
            default: 
              sentiment = -1; 
              break;
          }

          let resobj = utils.Get_ResObj(); 
          
          console.log("user.Daily_Analysis: ",user.Daily_Analysis);
          console.log("sentiment: ", sentiment); 

          resobj.version = req.body.version;  
          resobj.output.Answer = utils.Choose_Answer(paramPeriod,sentiment);  
          console.log("Response object")
          console.log(resobj);
          res.json(resobj);
          res.end();
          return;
        });//collection('users').findOne 닫기  
      }//if(database) 닫기  
    
      else {  
          console.log("Nugu/Diary_Conversation 수행 중 데이터베이스 연결 실패")
          res.end(); 
          return;
      }      
  };//Diary_Conversation 닫기   

  const Calculate_Daily_Analysis = async function(req, res){

    console.log("Nugu/Calculate_Daily_Analysis 호출 됨"); 
    
    await connection();

    //해당 주의 일요일에 해당하는 날 
    let paramNuguName = req.body.nuguname;  

    let today = utils.GetISODate(moment(new Date()).format('YYYY-MM-DD'));  
    let tomorrow = utils.GetISODate(moment(today).add(1,'days').format('YYYY-MM-DD'));
      if(database){
  
        //Calculate_Daily_Analysis에 쓰일 일기들 조회
        database.collection('diaries').findOne(
          {NuguName: paramNuguName, Date: {$gte: today, $lt: tomorrow}},
          async function(err, diary){ 
            if(err){
              console.log("Nugu/Calculate_Daily_Analysis에서 사용자 조회 중 에러 발생: " + err.stack); 
              res.end();
              return;
            }     

            if(!diary){
              console.log("Nugu/Calculate_Daily_Analysis에서 오늘 작성한 일기 조회 불가"); 
              res.end(); 
              return;
            }
            console.log("diary.Sentiment_Analysis: ",diary.Sentiment_Analysis);
            //계산한 값을 users table에 업데이트 
            database.collection('users').updateOne({NuguName: paramNuguName}, { $set: {Daily_Analysis: diary.Sentiment_Analysis}}, function(err){
              if(err){
                console.log("Nugu/Calculate_Daily_Analysis에서 사용자 업데이트 중 에러 발생: " + err.stack); 
                res.end();
                return;
              }   
            });//collection('users').updateOne 닫기
          });//collection('diaries').find 닫기
        } 
      else{
        console.log("Nugu/Calculate_Daily_Analysis 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
      } 
  };//Calculate_Daily_Analysis 닫기


  const Calculate_Weekly_Analysis = async function(req, res){

    console.log("Nugu/Calculate_Weekly_Analysis 호출 됨"); 
    
    await connection();

    //해당 주의 일요일에 해당하는 날
    let paramStartDate = utils.GetISODate(moment(req.body.startdate).format('YYYY-MM-DD')); 
    let paramEndDate = utils.GetISODate(moment(req.body.startdate).add(7,'days').format('YYYY-MM-DD')); 
    let paramNuguName = req.body.nuguname;  
  
    console.log("paramStartDate: ",paramStartDate); 
    console.log("paramEndDate: ",paramEndDate); 
    console.log("paramNuguName: ",paramNuguName); 
  
      if(database){
  
        //Calculate_Weekly_Analysis에 쓰일 일기들 조회
        database.collection('diaries').find(
          {NuguName: paramNuguName, Date: {$gte: paramStartDate, $lt: paramEndDate}})
          .toArray(async function(err, diaries){ 
            if(err){
              console.log("Nugu/Calculate_Weekly_Analysis에서 사용자 조회 중 에러 발생: " + err.stack); 
              res.end();
              return;
            }    
            
            let weekly_analysis = 0;
            
            //Sentiment_Analysis 의 값이 -1인 일기들의 갯수
            let dummy_count = 0;
  
            //이번 주 일기들 중 Sentiment_Analysis 의 값이 -1인 일기들을 제외한 일기들의 평균을 구한다.
            for(let i=0;i<diaries.length;i++){
              if(diaries[i].Sentiment_Analysis === -1){ 
                dummy_count++;
                continue;
              }
              weekly_analysis = weekly_analysis + diaries[i].Sentiment_Analysis;
            }
            
            weekly_analysis = weekly_analysis/(diaries.length-dummy_count); 
            
            //계산한 값을 users table에 업데이트 
            database.collection('users').updateOne({NuguName: paramNuguName}, { $set: {Weekly_Analysis: weekly_analysis}}, function(err){
              if(err){
                console.log("Nugu/Calculate_Weekly_Analysis에서 사용자 업데이트 중 에러 발생: " + err.stack); 
                res.end();
                return;
              }   
            });//collection('users').updateOne 닫기
          });//collection('diaries').find 닫기
        } 
      else{
        console.log("Nugu/Calculate_Weekly_Analysis 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
      } 
  };//Calculate_Weekly_Analysis 닫기 
  
  const Calculate_Monthly_Analysis = async function(req, res){
  
    console.log("Nugu/Calculate_Monthly_Analysis 호출 됨"); 
  
    await connection();
  
    const paramNuguName = req.body.nuguname;
    const paramYear = req.body.year; 
    const paramMonth = req.body.month; 
    
    //입력 받은 paramYear 과 parmaMonth 를 기준으로 조회 시작/끝 날짜를 설정
    const startdate = paramYear + "-" + paramMonth + "-" + "01";  
    const enddate = moment(startdate).endOf('month').format('YYYY-MM-DD');    
    const ISOstartdate = utils.GetISODate(startdate)
    const ISOenddate = utils.GetISODate(enddate)
  
    console.log('paramNuguName: ',paramNuguName);
    console.log('paramYear: ',paramYear);
    console.log('paramMonth: ',paramMonth); 
    console.log('ISOstartdate: ',ISOstartdate); 
    console.log('ISOenddate: ',ISOenddate); 
    
    if(database){       
  
      database.collection('diaries').find( 
        {
          NuguName: paramNuguName, 
          Date: {$gte: ISOstartdate, $lte: ISOenddate} 
        }).toArray(
        function(err,diaries){ 
          if(err){
            console.log("Nugu/Search_Monthly_Diary에서 일기 조회 중 에러 발생: "+ err.stack)
          }  
            
          let monthly_analysis = 0;
          
          //Sentiment_Analysis 의 값이 -1인 일기들의 갯수
          let dummy_count = 0;
  
          //이번 달 일기들 중 Sentiment_Analysis 의 값이 -1인 일기들을 제외한 일기들의 평균을 구한다.
          for(let i=0;i<diaries.length;i++){
            if(diaries[i].Sentiment_Analysis === -1){ 
              dummy_count++;
              continue;
            }
            monthly_analysis = monthly_analysis + diaries[i].Sentiment_Analysis;
          }
          
          monthly_analysis = monthly_analysis/(diaries.length-dummy_count); 
          console.log("monthly_analysis: ",monthly_analysis)
          //계산한 값을 users table에 업데이트 
          database.collection('users').updateOne({NuguName: paramNuguName}, { $set: {Monthly_Analysis: monthly_analysis}}, function(err){
            if(err){
              console.log("Nugu/Calculate_Monthly_Analysis에서 사용자 업데이트 중 에러 발생: " + err.stack); 
              res.end();
              return;
            }   
          });//collection('users').updateOne 닫기
        });//collection('diaries').find 닫기
      } 
      else{
        console.log("Nugu/Calculate_Monthly_Analysis 수행 중 데이터베이스 연결 실패")
        res.end(); 
        return;
      } 
  };//Calculate_Monthly_Analysis 닫기

module.exports.Assign_NuguName = Assign_NuguName;  
module.exports.Diary_Conversation = Diary_Conversation; 
module.exports.Calculate_Daily_Analysis = Calculate_Daily_Analysis;
module.exports.Calculate_Weekly_Analysis = Calculate_Weekly_Analysis;
module.exports.Calculate_Monthly_Analysis = Calculate_Monthly_Analysis;