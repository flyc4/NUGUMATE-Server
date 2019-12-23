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
      async function(err,name){
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
        async function(err){
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

//오늘 부터 7일 전 까지의 sentiment 평균 계산 후 그 기반으로 응답 
const First_Answer = async function(req, res){

console.log("Nugu/First_Answer 호출 됨"); 

await connection();
 

/* 누구 없이 날짜 테스트 용
let paramEndDate = utils.GetISODate(moment(req.body.date).format('YYYY-MM-DD'))|| utils.GetISODate(new Date().format('YYYY-MM-DD')); 
let paramStartDate = utils.GetISODate(moment(req.body.date).add(-6,'days').format('YYYY-MM-DD'));
*/

let paramStartDate = utils.GetISODate(moment(new Date()).add(-6,'days').format('YYYY-MM-DD'));
let paramEndDate = utils.GetISODate(moment(new Date()).format('YYYY-MM-DD')); 

let paramNuguName = req.body.action.parameters.nuguname.value;  

console.log("paramStartDate: ",paramStartDate); 
console.log("paramEndDate: ",paramEndDate); 
console.log("paramNuguName: ",paramNuguName); 

  if(database){

    //First_Answer에 쓰일 일기들 조회
    database.collection('diaries').find(
      {NuguName: paramNuguName, Date: {$gte: paramStartDate, $lte: paramEndDate}})
      .toArray(async function(err, diaries){ 
        if(err){
          console.log("Nugu/First_Answer에서 사용자 조회 중 에러 발생: " + err.stack); 
          res.end();
          return;
        }    
        //7일 동안 적은 일기 들의 sentiment_analysis의 평균 값 저장
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
        console.log("weekly_analysis: ",weekly_analysis);
        weekly_analysis = weekly_analysis/(diaries.length-dummy_count); 
        

        //계산한 값을 users table에 업데이트 
        database.collection('users').updateOne({NuguName: paramNuguName}, { $set: {Sentiment_Analysis: weekly_analysis}}, async function(err){
          if(err){
            console.log("Nugu/First_Answer에서 사용자 업데이트 중 에러 발생: " + err.stack); 
            res.end();
            return; 
          }    
          else{
            let resobj = utils.Get_ResObj(); 
            resobj.version = req.body.version;  
            resobj.output.Answer = await utils.First_Answer(weekly_analysis);  
            res.json(resobj);
            res.end();
            return;
          }
        });//collection('users').updateOne 닫기
      });//collection('diaries').find 닫기
    } 
  else{
    console.log("Nugu/First_Answer 수행 중 데이터베이스 연결 실패")
    res.end(); 
    return;
  } 
};//First_Answer 닫기 

const Second_Answer = async function(req, res){

  console.log("Nugu/Second_Answer 호출 됨"); 
  
  await connection();
   
  let paramNuguName = req.body.action.parameters.nuguname.value;
  let paramCondition = req.body.action.parameters.condition.value;
  
  //condition: paramCondition의 값에 따라 positive / negative 저장 
  //answer: 응답 값
  let condition = " "; 
  let answer = " ";

  console.log("paramNuguName: ",paramNuguName);
  console.log("paramCondition: ",paramCondition); 
  
  //Condition을 긍정 / 부정으로 분류 
  if(paramCondition == "기뻤어"||paramCondition == "들떴어"||paramCondition == "좋았어"){
    condition = "postive"; 
  } 
  else{
    condition = "negative";
  }
  
  if(database){
    //계산한 값을 users table에 업데이트 
    database.collection('users').findOne({NuguName: paramNuguName}, async function(err, user){
      if(err){
        console.log("Nugu/Second_Answer에서 사용자 업데이트 중 에러 발생: " + err.stack); 
        res.end();
        return; 
      }    
      else{ 

        //1 주일 동안 감정이 좋을 때
        if(user.Sentiment_Analysis>= 0.5){

          if(condition === "postive"){
              answer = "항상 기분이 좋으시니까 저도 기분이 좋아요. 계속 이렇게 기분 좋은 일만 있었으면 좋겠어요.";
          } 
          else{
            answer = "가끔씩은 돌부리에 걸려 넘어지는 경우도 있죠. 그래도 이번 주에는 기분이 좋으셨는 데, 액땜했다고 생각하시고 가볍게 넘어가시는 건 어떨까요?";
          }
        }//if(user.Sentiment_Analysis>= 0.5) 닫기 

        //1주일 동안 감정이 안 좋을 때
        else{
          if(condition === "postive"){
            answer = "그래도 기분이 나아진 것 같아서 다행이에요. 이 기분 그대로 이번 주도 화이팅! 힘이 나게 신나는 노래 들어보시는 건 어떨까요?";
          } 
          else{
            answer = "그렇게 힘드신데, 제가 도와드릴 수 없어 아쉽네요. 대신 위로가 되는 노래를 들으시면서 마음을 푸시는 건 어떨까요 노래 틀어 드릴게요";
          }
        }
        let resobj = utils.Get_ResObj(); 
        resobj.version = req.body.version;  
        resobj.output.Answer = answer;  
        res.json(resobj);
        res.end();
        return;
      }
    });//collection('users').updateOne 닫기
} 
else{
console.log("Nugu/First_Answer 수행 중 데이터베이스 연결 실패")
res.end(); 
return;
} 
  };//Second_Answer 닫기 

  
module.exports.Assign_NuguName = Assign_NuguName;   
module.exports.First_Answer = First_Answer; 
module.exports.Second_Answer = Second_Answer; 