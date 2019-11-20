const moment = require('moment')

/*
Specifications-answers for positive/negative sentiment에 해당 
_Daily: 일간 질문에 대한 대답 들 
_Period: 주간 / 월간 질문에 대한 대답 들 

'님' 글자 앞에 userid 나 keyword 붙일 예정. 
*/
const Answers_For_Positive_Sentiment_Daily = [
  "님이 기분이 좋은 것 같아서 저도 기분이 좋아요", 
  "님을 보니 저도 행복해요", 
  "님이 헹복헤보여서 저도 좋아요"
 ]; 

const Answers_For_Negative_Sentiment_Daily = [
  "님이 기분이 안 좋아 보여서 걱정이 되요", 
  "님, 잘 지내고 있는 거 맞죠? 잊지 말고 꼭 밥 먹어요", 
  "님. 오늘 기분이 잘 안 좋아 보이지만, 잘 해낼 수 있을 거라 믿어요."
 ]; 

const Answers_For_Positive_Sentiment_Period = [
  "님이 요즘 잘 지내는 것 같아서 저도 기분이 좋아요", 
  "님, 요즘 좋은 일이 많으신가 봐요. 저도 행복해요.", 
 ]; 

const Answers_For_Negative_Sentiment_Period = [
  "님이 요즘 기분이 안 좋아 보여서 걱정이 되요", 
  "님, 요즘 밥은 잘 드시고 있나요? 잊지 말고 꼭 밥 먹어요", 
  "님. 요새 기분이 잘 안 좋아 보이지만, 잘 해낼 수 있을 거라 믿어요."
 ]; 
 
 const Answers_For_No_Sentiment = [
  "님을 아직 잘 모르겠어요. 앱에 일기를 적어주세요."
 ];

//누구 스피커에서 period 파라미터로 받은 것들 중에서 daily 로 대표할 수 있는 값들 
const Daily_Words = [
  "오늘", "지금"
]

const Weekly_Words = [
  "이번주", "요번주", "요즘"
]

const Monthly_Words = [
  "이번달", "요번달"
]


//현재 시간을 ISO 형식으로 반환
const timestamp = function(){         
  return moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
}  

//YYYY-MM-DD 형식의 날짜 파일을 ISO 형식으로 반환
const GetISODate = function(Data){
  const date = new Date(Data+"T00:00:00.000Z")
  return date
} 

//YYYY-MM-DD 형식의 일 수 덧셈
const AddDays = function(StartDay,Days){
  const EndDay = moment(StartDay).add(Days,"days").format("YYYY-MM-DD")
  return EndDay 
}  
//시스템 날짜의 월의 1일 반환. 
// ex. 2019-10-09 => 2019-10-01 반환
const Year = new Date().getFullYear()
const Month = new Date().getMonth() +1; 
//startday를 못 받을 경우 시스템 월의 1일
const defaultstartday = moment(Year + "-" + Month + "-" + "01").format("YYYY-MM-DD") 

//날짜 데이터를 'YYYY-MM-DD' 꼴로 변환
const GetNormalDate = function(Data){
  return moment(Data).format("YYYY-MM-DD")
}

//eventcalendar으로 보낼 때 contents에 날짜를 포함할 거임. 그 날짜와 더불어 들어갈 내용을 정의
const DateToContents = function(date){ 
  return "Date: " + date;
}

const GenerateRandomNumber = function(min,max){
  return Math.floor(Math.random() * (max - min)) + min;
}


//Specifications-Answer Data-Choose_and_Send_Answer 에서 choose의 과정
//userid: 사용자 식별 정보. 모든 응답 앞에 붙여질 내용 
//period: 일간, 주간/월간 대화 중 무엇인지 식별. (daily, period)
//sentiment: 0/1/-1. 
const Choose_Answer = function(userid,period,sentiment){

  //sentiment 값이 없다면 바로 return 
  if(sentiment===-1){
    return userid + Answers_For_No_Sentiment[0];
  }  
  else{
    //일간 대화
    if(period === "daily"){
      
      //일간 대화 & 긍정 감정
      if(sentiment >= 0.5){
        const random_number = GenerateRandomNumber(0,Answers_For_Positive_Sentiment_Daily.length-1); 
        return userid + Answers_For_Positive_Sentiment_Daily[random_number]; 
      }//일간 대화 & 긍정 감정 끝 

      else{
        const random_number = GenerateRandomNumber(0,Answers_For_Negative_Sentiment_Daily.length-1); 
        return userid + Answers_For_Negative_Sentiment_Daily[random_number]; 
      }//일간 대화 & 부정 감정 끝 
    }//if(period === "daily") 

    else{
      // 주간,월간 대화 & 긍정 감정
      if(sentiment >= 0.5){
        const random_number = GenerateRandomNumber(0,Answers_For_Positive_Sentiment_Period.length-1); 
        return userid + Answers_For_Positive_Sentiment_Period[random_number]; 
      }//주간,월간 대화 & 긍정 감정 끝 

      else{
        const random_number = GenerateRandomNumber(0,Answers_For_Negative_Sentiment_Period.length-1); 
        return userid + Answers_For_Negative_Sentiment_Period[random_number]; 
      }//주간,월간 대화 & 부정 감정 끝 
    }//주간, 월간 끝
  }//sentiment != -1
};


//specificaton에 없음. 사용자의 발화를 daily / weekly / monthly 중 하나로 분류 
const Determine_Period = function(period){

  if(Daily_Words.find(element => element === period)){
    return "daily";
  }  
  else if(Weekly_Words.find(element => element === period)){
    return "weekly";
  } 

  else if(Monthly_Words.find(element => element === period)){
      return "monthly";
  }  
  //기본 값은 daily로
  else{
    return "daily";
  }
}; 

const Get_ResObj = function(){
  let resobj = {
    "version": "2.0",
    "resultCode": "OK",
    "output": { 
    },
  }; 

  return resobj;
};

module.exports.timestamp = timestamp; 
module.exports.GetISODate = GetISODate; 
module.exports.AddDays = AddDays; 
module.exports.defaultstartday = defaultstartday; 
module.exports.GetNormalDate = GetNormalDate; 
module.exports.DateToContents = DateToContents; 
module.exports.Choose_Answer = Choose_Answer; 
module.exports.Determine_Period = Determine_Period; 
module.exports.Get_ResObj = Get_ResObj;