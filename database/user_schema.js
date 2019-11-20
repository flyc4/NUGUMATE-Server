let Schema = {};
let crypto = require('crypto');  


Schema.createSchema = function(mongoose) {
	 //mongoose.set('useCreateIndex', true);
	
	UserSchema = mongoose.Schema({
	  UserId: {type: String, default: 'dummy', required: true},   
	  Daily_Analysis: {type: Number, default: -1},
	  Weekly_Analysis: {type: Number, default: -1}, 
	  Monthly_Analysis: {type: Number, default: -1},  

	  //혹시 모를 상황에 대비
	  Keyword: {type: String, default: '아무개', required: true, trim: true}, // OAuth 없이 누구에서 임시 로그인 기능을 위한 속성
    //  salt: {type: String}, // 로컬 로그인 구현에 대한 대비
    //  hashed_password: {type: String, 'default':''},// 로컬 로그인 구현에 대한 대비    
    });
    
	// password를 virtual 메소드로 정의 : MongoDB에 저장되지 않는 가상 속성임. 
	/* 특정 속성을 지정하고 set, get 메소드를 정의함.  
	UserSchema
	  .virtual('password')
	  .set(function(password) {
	    this._password = password;
	    this.salt = this.makeSalt();
	    this.hashed_password = this.encryptPassword(password);
	    console.log('virtual password의 set 호출됨 : ' + this.hashed_password);
	  })
	  .get(function() {
           console.log('virtual password의 get 호출됨.');
           return this._password;
      });
	
	// 스키마에 모델 인스턴스에서 사용할 수 있는 메소드 추가
	// 비밀번호 암호화 메소드
	UserSchema.method('encryptPassword', function(plainText, inSalt) {
		if (inSalt) {
			return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
		} else {
			return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
		}
	});
	
	// salt 값 만들기 메소드
	UserSchema.method('makeSalt', function() {
		return Math.round((new Date().valueOf() * Math.random())) + '';
	});
	
	// 인증 메소드 - 입력된 비밀번호와 비교 (true/false 리턴)
	UserSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
		if (inSalt) {
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText, inSalt), hashed_password);
			return this.encryptPassword(plainText, inSalt) === hashed_password;
		} else {
			console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText), this.hashed_password);
			return this.encryptPassword(plainText) === this.hashed_password;
		} 
    });
    
	// 값이 유효한지 확인하는 함수 정의
	var validatePresenceOf = function(value) {
		return value && value.length;
	};
		
	// 저장 시의 트리거 함수 정의 (password 필드가 유효하지 않으면 에러 발생)
	UserSchema.pre('save', function(next) {
		if (!this.isNew) return next();
		/*
		if (!validatePresenceOf(this.password)) {
			next(new Error('유효하지 않은 password 필드입니다.'));
		} else {
			next();
		} 
		
	});
	
        UserSchema.path('hashed_password').validate(function(hashed_password){
        return hashed_password.length;
    }, 'hashed_password 칼럼의 값이 없습니다.'); 
    */
	//모델 객체에세 사용 가능한 메소드 정의  
	// 모델을 위한 스키마 등록
	mongoose.model('UserModel', UserSchema);
    
	console.log('UserSchema 정의함.');
	
	return UserSchema;  
};
// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

