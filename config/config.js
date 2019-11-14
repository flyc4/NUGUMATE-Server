
/*
 * 설정. DB URL 정의
 */

require('dotenv').config()

module.exports = {
	server_port: 3000,
	db_url: process.env.db_url,
	db_schemas: [
        {file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'}, 
        {file:'./diary_schema', collection:'diaries', schemaName:'DiarySchema', modelName:'DiaryModel'}, 
        ],
	route_info: [
        //user 혹은 인증과 관련된 패스들
         {file:'./user', path:'/process/user/checknickNm', method:'checknickNm', type:'post'} 
        ,{file:'./user', path:'/process/user/getuserid', method:'getuserid', type:'post'}
],      
};  

