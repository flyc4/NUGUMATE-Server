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

// 누구 스크립트 테스트. 파라미터 주고 받기 완료
const Test_Nugu = async function(req, res) {
    console.log('Nugu/Test_Nugu 호출됨.');
    await connection();  
    let answer = "이곳은 서버입니다.";
    //파라미터 값 조회 가능: { name: { type: 'TEST', value: '테스트' } }
    //console.log(req.body.action.parameters)
    let resobj = {
        "version": req.body.version,
        "resultCode": "OK",
        "output": {
            "name": answer, //해 봤는 데, request에서 보낸 파라미터와 다른 것을 넣을 수 없더라. play-kit: Actions/Custom Actions/4. Output 정의에서 {{name}} 
        },
    };
    res.json(resobj)
    res.end()
    return;
};//Test_Nugu 닫기 


//specifications: Server-Answer Data-Choose_and_Send_Answer
const Diary_Conversation = async function(req, res) {
    console.log('Nugu/Diary_Conversation 호출됨.');
    await connection();  
    
    //사용자 입력 값 
    console.log(req.body.action.parameters);
    const paramNuguName = req.body.action.parameters.NuguName.value;
    const paramPeriod = req.body.action.parameters.Period.value;   
    console.log('paramNuguName: ',paramNuguName);
    console.log('paramPeriod: ',paramPeriod); 
  
    if (database){       
      database.collection('users').findOne({NuguName: paramNuguName},
        function(err,user){
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
          let period = utils.Determine_Period(paramPeriod); 
          let sentiment = -1;
          
          switch(period){

            case "daily": 
              sentiment = user.Daily_Analysis; 
              break; 

            case "weekly": 
              sentiment = user.Weekly_Analysis; 
              break;
            
            case "monthly":
              sentiment = user.Monthly_Analysis; 
              break; 
            
            default: 
              sentiment = -1; 
              break;
          }

          let resobj = utils.Get_ResObj(); 
          
          console.log("user.Daily_Analysis: ",user.Daily_Analysis);
          console.log("period: ", period);
          console.log("sentiment: ", sentiment); 

          resobj.version = req.body.version;  
          resobj.output.Answer = utils.Choose_Answer(user.UserId,period,sentiment);  
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

module.exports.Test_Nugu = Test_Nugu;
module.exports.Diary_Conversation = Diary_Conversation;