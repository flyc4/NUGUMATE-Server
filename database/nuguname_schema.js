let Schema = {};

Schema.createSchema = function(mongoose) {
	 //mongoose.set('useCreateIndex', true);
	
	NuguNameSchema = mongoose.Schema({
	  Name: {type: String, default: ''},   
	  Assigned: {type: Boolean, default: false}  
    });
	//모델 객체에세 사용 가능한 메소드 정의  
	// 모델을 위한 스키마 등록
	mongoose.model('NuguNameModel', UserSchema);
    
	console.log('NuguNameSchema 정의함.');
	
	return NuguNameSchema;  
};
// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

