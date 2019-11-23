let Schema = {};

Schema.createSchema = function(mongoose) {
	 //mongoose.set('useCreateIndex', true);
	
	UserSchema = mongoose.Schema({
	  NuguName: {type: String, default: ''},   
	  Daily_Analysis: {type: Number, default: -1},
	  Weekly_Analysis: {type: Number, default: -1}, 
	  Monthly_Analysis: {type: Number, default: -1},  
    });
	//모델 객체에세 사용 가능한 메소드 정의  
	// 모델을 위한 스키마 등록
	mongoose.model('UserModel', UserSchema);
    
	console.log('UserSchema 정의함.');
	
	return UserSchema;  
};
// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

