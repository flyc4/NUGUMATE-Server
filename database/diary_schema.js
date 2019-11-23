let Schema = {};
 
Schema.createSchema = function(mongoose) {
	
	let DiarySchema = mongoose.Schema({
		
		_id : false, //collection에 model 객체를 삽입하는 방식으로 코딩했으므로 이게 필요함. diary/Save_Diary 참고 
		Date: {type: Date, default: '1900-01-01'}, 
		Contents: {type: String, default: 'no-contents'}, 
		NuguName: {type: String, default: " "}, 
		Sentiment_Analysis: {type: Number, default: -1},  

    });
	console.log('DiarySchema 정의함.');
	
	return DiarySchema;  
}; 
// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

