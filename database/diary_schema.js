let Schema = {};
 
Schema.createSchema = function(mongoose) {
	
	DiarySchema = mongoose.Schema({
		Date: {type: Date, default: '1900-01-01'}, 
		Contents: {type: String, default: 'no-contents'}, 
		UserId: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
		Sentiment_Analysis: {type: Number, default: -1},

    });
		
	DiarySchema.pre('save', function(next) {
		if (!this.isNew) return next();
	});
	
	// 모델을 위한 스키마 등록
	mongoose.model('DiaryModel', DiarySchema);
    
	console.log('DiarySchema 정의함.');
	
	return DiarySchema;  
};
// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

