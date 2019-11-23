const moment = require('moment')

/*
Specifications-answers for positive/negative sentiment에 해당 
_Daily: 일간 질문에 대한 대답 들 
_Period: 주간 / 월간 질문에 대한 대답 들 

'주인님' 글자 앞에 userid 나 keyword 붙일 예정. 
*/
const Answers_For_Positive_Sentiment_Daily = [
  "주인님이 기분이 좋은 것 같아서 저도 기분이 좋아요", 
  "주인님을 보니 저도 행복해요", 
  "주인님이 헹복해 보여서 저도 좋아요"
 ]; 

const Answers_For_Negative_Sentiment_Daily = [
  "기분이 안 좋아 보여서 걱정이 되요", 
  "요즘 기운이 없어 보여서 걱정이 되요. 밥은 잘 챙겨 드시고 있죠?", 
  "흠.. 다른 건 괜찮지만 주인님이 꽤 걱정이 되요. 저는 언제나 주인님의 고민을 듣고 싶어요/"
 ]; 

const Answers_For_Positive_Sentiment_Period = [
  "요즘 잘 지내는 것 처럼 보여서 저도 기분이 좋아요", 
  "요즘 좋은 일이 많으신가 봐요. 저도 행복해요.", 
 ]; 

const Answers_For_Negative_Sentiment_Period = [
  "요즘 기분이 안 좋아 보여서 걱정이 되요", 
  "주인님 걱정이 한가득해요. 요즘 밥은 잘 드시고 있나요? 잊지 말고 꼭 밥 먹어요", 
  "주인님 걱정이 태산이에요.. 요새 기분이 안 좋아 보이지만, 잘 해낼 수 있을 거라 믿어요."
 ]; 
 
 const Answers_For_No_Sentiment = [
  "흠.. 그냥 그랬어요. 일기를 통해서 주인님을 좀 더 알고 싶어요."
 ];

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
const Choose_Answer = function(period,sentiment){

  //sentiment 값이 없다면 바로 return 
  if(sentiment===-1){
    return Answers_For_No_Sentiment[0];
  }  
  else{
    //일간 대화
    if(period === "daily"){
      
      //일간 대화 & 긍정 감정
      if(sentiment >= 0.5){
        const random_number = GenerateRandomNumber(0,Answers_For_Positive_Sentiment_Daily.length-1); 
        return Answers_For_Positive_Sentiment_Daily[random_number]; 
      }//일간 대화 & 긍정 감정 끝 

      else{
        const random_number = GenerateRandomNumber(0,Answers_For_Negative_Sentiment_Daily.length-1); 
        return Answers_For_Negative_Sentiment_Daily[random_number]; 
      }//일간 대화 & 부정 감정 끝 
    }//if(period === "daily") 

    else{
      // 주간,월간 대화 & 긍정 감정
      if(sentiment >= 0.5){
        const random_number = GenerateRandomNumber(0,Answers_For_Positive_Sentiment_Period.length-1); 
        return Answers_For_Positive_Sentiment_Period[random_number]; 
      }//주간,월간 대화 & 긍정 감정 끝 

      else{
        const random_number = GenerateRandomNumber(0,Answers_For_Negative_Sentiment_Period.length-1); 
        return  Answers_For_Negative_Sentiment_Period[random_number]; 
      }//주간,월간 대화 & 부정 감정 끝 
    }//주간, 월간 끝
  }//sentiment != -1
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

const Get_First_Day_of_Current_Week = function(date){
  
  const day = new Date(date).getDay()*-1;
  return moment(date).add(day,'days').format('YYYY-MM-DD');

};

module.exports.timestamp = timestamp; 
module.exports.GetISODate = GetISODate; 
module.exports.AddDays = AddDays; 
module.exports.defaultstartday = defaultstartday; 
module.exports.GetNormalDate = GetNormalDate; 
module.exports.DateToContents = DateToContents; 
module.exports.Choose_Answer = Choose_Answer; 
module.exports.Get_ResObj = Get_ResObj; 
module.exports.Get_First_Day_of_Current_Week = Get_First_Day_of_Current_Week; 